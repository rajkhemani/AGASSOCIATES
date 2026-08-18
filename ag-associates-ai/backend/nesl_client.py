"""NeslClient — Dual-mode NeSL (National e-Services Ltd) e-filing client.

Modes (auto-selected by available config):
  1. API mode    — REST API call when NESL_API_KEY is set (production)
  2. RPA mode    — Playwright IGR portal automation when IGR_PORTAL_* creds set
  3. Mock mode   — Simulated filing when neither is configured (fallback)

Idempotency: Every API call uses an idempotency key derived from case_id + document_type
to prevent duplicate filings. RPA mode uses Redis to track completed filings.
"""

import asyncio
import hashlib
import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from circuit_breaker import get_breaker, CircuitState
from hitl_queue import hitl_queue
from igr_executor import igr_executor
from logging_config import get_logger, log_llm_call
from workforce.ledger import record_activity

logger = get_logger(__name__)


class NeslClient:
    """NeSL e-filing client with automatic mode selection and idempotency."""

    def __init__(self):
        self.api_key = os.environ.get("NESL_API_KEY", "")
        self.api_base_url = os.environ.get(
            "NESL_API_BASE_URL", "https://api.nesl.co.in/v1"
        )
        self.api_client_id = os.environ.get("NESL_CLIENT_ID", "")
        self.api_client_secret = os.environ.get("NESL_CLIENT_SECRET", "")
        self.mock_delay = float(os.environ.get("NESL_MOCK_DELAY_SEC", "3"))
        self.request_timeout = float(os.environ.get("NESL_REQUEST_TIMEOUT_SEC", "30"))

        self.igr_portal_url = os.environ.get(
            "IGR_PORTAL_URL", "https://igrmaharashtra.gov.in/efiling/"
        )
        self.igr_username = os.environ.get("IGR_PORTAL_USERNAME", "")
        self.igr_password = os.environ.get("IGR_PORTAL_PASSWORD", "")

        self.mode = self._detect_mode()

    def _detect_mode(self) -> str:
        if self.api_key:
            return "api"
        if self.igr_username and self.igr_password:
            return "rpa"
        return "mock"

    def _generate_idempotency_key(self, case_id: str, document_type: str) -> str:
        """Generate deterministic idempotency key for a filing."""
        raw = f"{case_id}:{document_type}"
        return hashlib.sha256(raw.encode()).hexdigest()[:32]

    def _generate_transaction_id(self) -> str:
        raw = f"{uuid.uuid4().hex}{datetime.utcnow().isoformat()}"
        return f"NESL-{hashlib.sha256(raw.encode()).hexdigest()[:12].upper()}"

    def _generate_filing_reference(self, case_id: Optional[str] = None) -> str:
        prefix = case_id[-6:] if case_id else "REF"
        return f"IGR{prefix}{datetime.now().strftime('%y%m%d%H%M%S')}"

    async def execute(
        self,
        case_id: Optional[str] = None,
        document_type: str = "INTIMATION_MORTGAGE",
        document_data: Optional[Dict[str, Any]] = None,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """File a document with NeSL. Auto-selects mode based on config.

        Args:
            case_id: Unique case identifier
            document_type: Type of document (INTIMATION_MORTGAGE, etc.)
            document_data: Structured document data for filing
            idempotency_key: Optional custom idempotency key (auto-generated if not provided)

        Returns:
            Dict with success, transaction_id, filing_reference, message, mode
        """
        if case_id is None:
            case_id = f"UNKNOWN-{uuid.uuid4().hex[:8]}"

        # Check if already filed (idempotency)
        existing = await self._check_existing_filing(case_id, document_type)
        if existing:
            logger.info(f"Duplicate filing detected for {case_id}:{document_type}, returning existing result")
            return existing

        if self.mode == "api":
            return await self._api_execute(case_id, document_type, document_data, idempotency_key)
        elif self.mode == "rpa":
            return await self._rpa_execute(case_id, document_type, document_data, idempotency_key)

        return await self._mock_execute(case_id, document_type, idempotency_key)

    async def _check_existing_filing(self, case_id: str, document_type: str) -> Optional[Dict[str, Any]]:
        """Check Redis for existing filing to enforce idempotency."""
        import redis.asyncio as aioredis
        r = aioredis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))
        try:
            key = f"nesl:filing:{case_id}:{document_type}"
            data = await r.get(key)
            if data:
                import json
                return json.loads(data)
        finally:
            await r.close()
        return None

    async def _store_filing_result(self, case_id: str, document_type: str, result: Dict[str, Any]):
        """Store filing result in Redis for idempotency."""
        import redis.asyncio as aioredis
        import json
        r = aioredis.from_url(os.environ.get("REDIS_URL", "redis://localhost:6379"))
        try:
            key = f"nesl:filing:{case_id}:{document_type}"
            await r.setex(key, 86400 * 30, json.dumps(result))  # 30 days TTL
        finally:
            await r.close()

    @retry(
        wait=wait_exponential(multiplier=1, min=2, max=30),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException)),
    )
    async def _api_execute(
        self,
        case_id: str,
        document_type: str,
        document_data: Optional[Dict[str, Any]],
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Authenticated NeSL REST API filing with retry logic."""
        idem_key = idempotency_key or self._generate_idempotency_key(case_id, document_type)

        payload = {
            "document_type": document_type,
            "filing_timestamp": datetime.utcnow().isoformat() + "Z",
            "case_id": case_id,
            "document_data": document_data or {},
            "idempotency_key": idem_key,
        }

        start_time = datetime.utcnow()
        try:
            async with httpx.AsyncClient(timeout=self.request_timeout) as client:
                resp = await client.post(
                    f"{self.api_base_url}/filings",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self._get_access_token()}",
                        "X-API-Key": self.api_key,
                        "Content-Type": "application/json",
                        "Idempotency-Key": idem_key,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

            transaction_id = data.get("transaction_id", self._generate_transaction_id())
            filing_ref = data.get("filing_reference", self._generate_filing_reference(case_id))
            duration = (datetime.utcnow() - start_time).total_seconds()

            result = {
                "success": True,
                "transaction_id": transaction_id,
                "filing_reference": filing_ref,
                "message": f"Document filed with NeSL via API — Ref: {filing_ref}",
                "mode": "api",
            }

            await self._store_filing_result(case_id, document_type, result)

            record_activity(
                source="nesl_client",
                staff_kind="agent",
                staff_short_name="nesl_executor",
                capability_code="nesl.api_filing",
                case_id=case_id,
                summary=f"NeSL API filing — {document_type}, Ref: {filing_ref}",
                payload={"transaction_id": transaction_id, "mode": "api", "duration_sec": duration},
                status="ok",
            )

            log_llm_call("nesl_client", "api", 0, 0, duration)
            return result

        except httpx.HTTPStatusError as exc:
            logger.error(f"NeSL API filing failed (HTTP {exc.response.status_code}): {exc}")
            # Don't retry 4xx errors
            if 400 <= exc.response.status_code < 500:
                raise
            # Let tenacity retry 5xx errors
            raise
        except Exception as exc:
            logger.error(f"NeSL API filing failed: {exc}")
            raise

    def _get_access_token(self) -> str:
        """Obtain NeSL API access token using client credentials."""
        import base64

        creds = f"{self.api_client_id}:{self.api_client_secret}"
        return base64.b64encode(creds.encode()).decode()

    async def _rpa_execute(
        self,
        case_id: str,
        document_type: str,
        document_data: Optional[Dict[str, Any]],
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Playwright-based IGR portal e-filing fallback with idempotency."""
        # Check RPA idempotency
        existing = await self._check_existing_filing(case_id, document_type)
        if existing:
            return {**existing, "mode": "rpa"}

        from igr_executor import igr_executor

        data = document_data or {}

        result = await igr_executor.file_noi(
            case_id=case_id,
            borrower_name=data.get("borrower_name", ""),
            loan_amount=data.get("loan_amount", "0"),
            property_address=data.get("property_address", ""),
            property_city=data.get("property_city", ""),
            bank_name=data.get("bank_name", ""),
            grn_number=data.get("grn_number", ""),
        )

        if result.get("success"):
            result = {
                "success": True,
                "transaction_id": self._generate_transaction_id(),
                "filing_reference": result.get("acknowledgment_number"),
                "message": f"Document filed via IGR portal — Ack: {result.get('acknowledgment_number')}",
                "mode": "rpa",
            }
            await self._store_filing_result(case_id, document_type, result)

        return result

    async def _mock_execute(
        self,
        case_id: str,
        document_type: str,
        idempotency_key: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Simulated filing — returns fake acknowledgment after configured delay."""
        await asyncio.sleep(self.mock_delay)

        filing_ref = self._generate_filing_reference(case_id)
        transaction_id = self._generate_transaction_id()

        result = {
            "success": True,
            "transaction_id": transaction_id,
            "filing_reference": filing_ref,
            "message": f"Document successfully filed with NeSL registry (mock) — Ref: {filing_ref}",
            "mode": "mock",
        }

        await self._store_filing_result(case_id, document_type, result)

        record_activity(
            source="nesl_client",
            staff_kind="agent",
            staff_short_name="nesl_executor",
            capability_code="nesl.mock_filing",
            case_id=case_id,
            summary=f"NeSL mock filing — {document_type}, Ref: {filing_ref}",
            payload={"transaction_id": transaction_id, "mode": "mock"},
            status="ok",
        )

        return result

    async def check_status(self, filing_reference: str) -> Dict[str, Any]:
        """Check filing status on NeSL/IGR portal."""
        if self.mode == "api":
            try:
                async with httpx.AsyncClient(timeout=self.request_timeout) as client:
                    resp = await client.get(
                        f"{self.api_base_url}/filings/{filing_reference}",
                        headers={
                            "Authorization": f"Bearer {self._get_access_token()}",
                            "X-API-Key": self.api_key,
                        },
                    )
                    resp.raise_for_status()
                    return resp.json()
            except Exception as exc:
                logger.error(f"NeSL status check failed: {exc}")
                return {"success": False, "error": str(exc)}

        return {
            "success": True,
            "filing_reference": filing_reference,
            "status": "PROCESSING",
            "estimated_completion": "7-10 working days",
            "mode": self.mode,
        }

    async def cancel_filing(self, case_id: str, document_type: str) -> Dict[str, Any]:
        """Cancel a pending filing (if supported by NeSL)."""
        if self.mode == "api":
            try:
                async with httpx.AsyncClient(timeout=self.request_timeout) as client:
                    resp = await client.delete(
                        f"{self.api_base_url}/filings/{case_id}:{document_type}",
                        headers={
                            "Authorization": f"Bearer {self._get_access_token()}",
                            "X-API-Key": self.api_key,
                        },
                    )
                    resp.raise_for_status()
                    return {"success": True, "message": "Filing cancelled"}
            except Exception as exc:
                logger.error(f"NeSL cancellation failed: {exc}")
                return {"success": False, "error": str(exc)}

        return {"success": False, "error": "Cancellation only supported in API mode"}


nesl_client = NeslClient()