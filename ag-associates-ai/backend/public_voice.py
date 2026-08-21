"""Constrained public voice assistant boundary for the AG Associates website.

This router is intentionally separate from the authenticated admin voice
automation system. Anonymous visitors can receive approved FAQ answers and
prepare a lead or callback request, but cannot access matters, documents, or
operational tools.
"""

from __future__ import annotations

import os
import re
import tempfile
import time
import uuid
from datetime import datetime, timezone
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator, model_validator

router = APIRouter(prefix="/public/voice", tags=["Public Voice"])

SESSION_TTL_SECONDS = 15 * 60
RATE_WINDOW_SECONDS = 60
RATE_LIMIT = 20
_sessions: dict[str, dict[str, object]] = {}
_requests: defaultdict[str, deque[float]] = defaultdict(deque)
_lead_requests: defaultdict[str, deque[float]] = defaultdict(deque)

FAQ_RESPONSES = {
    "services": (
        "AG Associates supports banking legal operations including Notice of "
        "Intimation filings, title search reports, document vetting, mortgage "
        "registration, and related property documentation."
    ),
    "location": "AG Associates is based in Thane, Maharashtra, and serves the Mumbai MMR region.",
    "contact": "I can help you prepare a callback request for the AG Associates team.",
    "disclosure": (
        "I am an AI assistant for general information. I cannot provide a "
        "case-specific legal opinion or submit a government filing."
    ),
}


def _ensure_enabled() -> None:
    if os.environ.get("VOICE_SYSTEM_ENABLED", "true").strip().lower() == "false":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="public voice assistant is disabled",
        )


class VoiceSessionRequest(BaseModel):
    consent: bool
    locale: str = Field(default="en-IN", min_length=2, max_length=16)
    source: str = Field(default="public_voice", min_length=1, max_length=64)

    @field_validator("locale")
    @classmethod
    def normalize_locale(cls, value: str) -> str:
        return value.replace("_", "-")


class VoiceSessionResponse(BaseModel):
    session_id: str
    provider: Literal["mock", "managed"]
    expires_in_seconds: int
    disclosure: str


class PublicLeadDetails(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    organization: str | None = Field(default=None, max_length=160)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=320)
    preferred_time: str | None = Field(default=None, max_length=120)

    @field_validator("name", "organization", "preferred_time")
    @classmethod
    def clean_text(cls, value: str | None) -> str | None:
        normalized = " ".join(value.split()) if value else None
        return normalized

    @field_validator("name")
    @classmethod
    def require_name(cls, value: str) -> str:
        if not value:
            raise ValueError("name is required")
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        normalized = value.strip().lower() if value else ""
        if not normalized:
            return None
        if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", normalized):
            raise ValueError("email must be valid")
        return normalized

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        if not value:
            return None
        normalized = "".join(ch for ch in value if ch.isdigit() or ch == "+")
        if normalized.startswith("00"):
            normalized = "+" + normalized[2:]
        if len(normalized.lstrip("+")) < 7:
            raise ValueError("phone must contain at least 7 digits")
        return normalized

    @model_validator(mode="after")
    def require_contact(self) -> "PublicLeadDetails":
        if not self.phone and not self.email:
            raise ValueError("name and phone or email are required")
        return self


class VoiceRespondRequest(BaseModel):
    session_id: str = Field(min_length=20, max_length=128)
    transcript: str = Field(min_length=1, max_length=1000)
    confirmed: bool = False
    lead: PublicLeadDetails | None = None

    @field_validator("transcript")
    @classmethod
    def clean_transcript(cls, value: str) -> str:
        return " ".join(value.split())


def _check_rate_limit(request: Request) -> None:
    now = time.time()
    key = _client_key(request)
    bucket = _requests[key]
    while bucket and bucket[0] <= now - RATE_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="voice request limit reached; try again shortly",
        )
    bucket.append(now)


def _client_key(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _session_valid(session_id: str) -> bool:
    session = _sessions.get(session_id)
    if session is None:
        return False
    expires_at = session["expires_at"]
    if not isinstance(expires_at, (int, float)):
        return False
    if expires_at <= time.time():
        _sessions.pop(session_id, None)
        return False
    return True


def _check_lead_rate_limit(request: Request) -> None:
    now = time.time()
    key = _client_key(request)
    bucket = _lead_requests[key]
    while bucket and bucket[0] <= now - 3600:
        bucket.popleft()
    if len(bucket) >= 5:
        raise HTTPException(status_code=429, detail="lead submission limit reached; try again later")
    bucket.append(now)


def _cleanup_expired_sessions() -> None:
    now = time.time()
    for session_id, session in list(_sessions.items()):
        expires_at = session.get("expires_at")
        if isinstance(expires_at, (int, float)) and expires_at <= now:
            _sessions.pop(session_id, None)


def _classify(transcript: str) -> str:
    text = transcript.lower()
    if any(word in text for word in ("callback", "call me", "contact me", "phone")):
        return "callback_request"
    if any(word in text for word in ("email", "enquiry", "inquiry", "empanel", "interested")):
        return "lead_capture"
    if any(word in text for word in ("case", "matter", "borrower", "document for my")):
        return "unsupported"
    if any(word in text for word in ("where", "location", "thane", "office")):
        return "faq"
    if any(word in text for word in ("service", "what do you do", "noi", "title", "mortgage")):
        return "faq"
    return "handoff"


@router.get("/health")
async def public_voice_health() -> dict[str, object]:
    enabled = os.environ.get("VOICE_SYSTEM_ENABLED", "true").strip().lower() != "false"
    return {
        "enabled": enabled,
        "provider": "open-source",
        "stt": "faster-whisper",
        "tts": "piper",
        "capabilities": ["faq", "lead_capture", "callback_request"],
    }


@router.post("/session", response_model=VoiceSessionResponse)
async def create_public_voice_session(
    payload: VoiceSessionRequest,
    request: Request,
) -> VoiceSessionResponse:
    _ensure_enabled()
    _check_rate_limit(request)
    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="explicit voice consent is required",
        )
    _cleanup_expired_sessions()
    session_id = f"pv_{uuid.uuid4().hex}"
    _sessions[session_id] = {
        "expires_at": time.time() + SESSION_TTL_SECONDS,
        "consented_at": datetime.now(timezone.utc),
        "source": payload.source,
        "client_key": _client_key(request),
    }
    return VoiceSessionResponse(
        session_id=session_id,
        provider="mock",
        expires_in_seconds=SESSION_TTL_SECONDS,
        disclosure=FAQ_RESPONSES["disclosure"],
    )


@router.post("/respond")
async def respond_to_public_voice(
    payload: VoiceRespondRequest,
    request: Request,
) -> dict[str, object]:
    _ensure_enabled()
    _check_rate_limit(request)
    if not _session_valid(payload.session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="voice session is missing or expired",
        )
    session = _sessions[payload.session_id]
    if session.get("client_key") != _client_key(request):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="voice session is not valid for this client",
        )

    intent = _classify(payload.transcript)
    if intent == "faq":
        text = payload.transcript.lower()
        answer = FAQ_RESPONSES["location"] if any(
            word in text for word in ("where", "location", "thane", "office")
        ) else FAQ_RESPONSES["services"]
        return {
            "intent": intent,
            "reply": f"{answer} {FAQ_RESPONSES['disclosure']}",
            "requires_confirmation": False,
        }

    if intent in {"lead_capture", "callback_request"}:
        if not payload.confirmed:
            return {
                "intent": intent,
                "reply": (
                    "I can prepare a request for the AG Associates team. "
                    "Please review the contact details before submitting."
                ),
                "requires_confirmation": True,
                "fields": ["name", "organization", "phone", "email", "preferred_time"],
            }
        if not payload.lead:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="lead details are required for confirmation",
            )
        _check_lead_rate_limit(request)
        from public_voice_persistence import persist_public_lead

        try:
            persisted = persist_public_lead(
                **payload.lead.model_dump(),
                intent=intent,
                consented_at=session["consented_at"],
                source=str(session["source"]),
                session_id=payload.session_id,
            )
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail="lead intake is not configured") from exc
        except Exception as exc:
            raise HTTPException(status_code=503, detail="lead could not be saved") from exc
        return {
            "intent": intent,
            "reply": "Your request is prepared for the AG Associates team to review.",
            "requires_confirmation": False,
            "request_id": persisted["lead_id"],
            "deduplicated": persisted["deduplicated"],
        }

    if intent == "unsupported":
        return {
            "intent": intent,
            "reply": (
                "I cannot access case files or provide a case-specific legal "
                "opinion here. Please request a callback from the AG Associates team."
            ),
            "requires_confirmation": False,
        }

    return {
        "intent": "handoff",
        "reply": (
            "I can explain AG Associates services or prepare a callback request. "
            "Please tell me which you need."
        ),
        "requires_confirmation": False,
    }


@router.post("/transcribe")
async def transcribe_public_audio(
    request: Request,
    audio: UploadFile = File(...),
) -> dict[str, str]:
    """Transcribe a short visitor utterance with the local Whisper service."""
    _ensure_enabled()
    _check_rate_limit(request)
    max_bytes = int(os.environ.get("PUBLIC_VOICE_MAX_AUDIO_BYTES", str(8 * 1024 * 1024)))
    content = await audio.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="audio payload is too large",
        )
    suffix = os.path.splitext(audio.filename or "voice.webm")[1] or ".webm"
    temp_path = ""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            temp.write(content)
            temp_path = temp.name
        from voice.whisper_service import get_whisper_service

        transcript = get_whisper_service().transcribe(temp_path)
        return {"transcript": transcript}
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except FileNotFoundError:
                pass


@router.post("/speak")
async def synthesize_public_speech(
    request: Request,
    text: str,
) -> Response:
    """Generate open-source Piper audio for a short assistant response."""
    _ensure_enabled()
    _check_rate_limit(request)
    if not text.strip() or len(text) > 1200:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="speech text must be between 1 and 1200 characters",
        )
    from voice.piper_service import synthesize

    audio = synthesize(text.strip())
    if not audio:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Piper voice model is not configured",
        )
    return Response(content=audio, media_type="audio/wav")
