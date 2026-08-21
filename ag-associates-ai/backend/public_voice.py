"""Constrained public voice assistant boundary for the AG Associates website.

This router is intentionally separate from the authenticated admin voice
automation system. Anonymous visitors can receive approved FAQ answers and
prepare a lead or callback request, but cannot access matters, documents, or
operational tools.
"""

from __future__ import annotations

import secrets
import os
import tempfile
import time
import uuid
from collections import defaultdict, deque
from typing import Literal

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel, Field, field_validator

router = APIRouter(prefix="/public/voice", tags=["Public Voice"])

SESSION_TTL_SECONDS = 15 * 60
RATE_WINDOW_SECONDS = 60
RATE_LIMIT = 20
_sessions: dict[str, float] = {}
_requests: defaultdict[str, deque[float]] = defaultdict(deque)

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


class VoiceSessionRequest(BaseModel):
    consent: bool
    locale: str = Field(default="en-IN", min_length=2, max_length=16)

    @field_validator("locale")
    @classmethod
    def normalize_locale(cls, value: str) -> str:
        return value.replace("_", "-")


class VoiceSessionResponse(BaseModel):
    session_id: str
    provider: Literal["mock", "managed"]
    expires_in_seconds: int
    disclosure: str


class VoiceRespondRequest(BaseModel):
    session_id: str = Field(min_length=20, max_length=128)
    transcript: str = Field(min_length=1, max_length=1000)
    confirmed: bool = False
    lead: dict[str, str] | None = None

    @field_validator("transcript")
    @classmethod
    def clean_transcript(cls, value: str) -> str:
        return " ".join(value.split())


def _check_rate_limit(request: Request) -> None:
    now = time.time()
    key = request.client.host if request.client else "unknown"
    bucket = _requests[key]
    while bucket and bucket[0] <= now - RATE_WINDOW_SECONDS:
        bucket.popleft()
    if len(bucket) >= RATE_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="voice request limit reached; try again shortly",
        )
    bucket.append(now)


def _session_valid(session_id: str) -> bool:
    expires_at = _sessions.get(session_id)
    if expires_at is None:
        return False
    if expires_at <= time.time():
        _sessions.pop(session_id, None)
        return False
    return True


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
    return {
        "enabled": True,
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
    _check_rate_limit(request)
    if not payload.consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="explicit voice consent is required",
        )
    session_id = f"pv_{uuid.uuid4().hex}"
    _sessions[session_id] = time.time() + SESSION_TTL_SECONDS
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
    _check_rate_limit(request)
    if not _session_valid(payload.session_id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="voice session is missing or expired",
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
        allowed = {"name", "organization", "phone", "email", "preferred_time"}
        sanitized = {
            key: value.strip()
            for key, value in payload.lead.items()
            if key in allowed and isinstance(value, str) and value.strip()
        }
        if not sanitized.get("name") or not (
            sanitized.get("phone") or sanitized.get("email")
        ):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="name and phone or email are required",
            )
        return {
            "intent": intent,
            "reply": "Your request is prepared for the AG Associates team to review.",
            "requires_confirmation": False,
            "request_id": secrets.token_urlsafe(16),
            "received": sanitized,
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
