"""Any-to-Any Input Router — universal input type detection and routing.

Detects input type (text, image, PDF, audio, Excel, DOCX) and routes to the
appropriate processor, then to the best agent for that content.

Usage:
    from agents.input_router import AnyInputRouter
    router = AnyInputRouter()
    result = await router.process(input_bytes=b"..." or text="...", filename="contract.pdf")

Flow:
    1. Detect input type (MIME / extension / content analysis)
    2. Route to correct media processor (media/processors.py)
    3. Classify content category (legal, financial, general)
    4. Route to the best agent for that content
    5. Return agent response
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class RouterResult:
    """Result from the any-to-any input router."""

    input_type: str  # text, image, pdf, audio, excel, docx
    content_type: str  # legal, financial, general
    extracted_text: str  # Text extracted from the file
    structured_data: dict  # Structured fields if available
    agent_name: str  # Which agent should handle this
    agent_response: Optional[str] = None  # Agent's response


class AnyInputRouter:
    """Universal input router: accepts any input, routes to the right agent."""

    EXTENSION_MAP = {
        ".jpg": "image",
        ".jpeg": "image",
        ".png": "image",
        ".gif": "image",
        ".webp": "image",
        ".bmp": "image",
        ".pdf": "pdf",
        ".xls": "excel",
        ".xlsx": "excel",
        ".csv": "excel",
        ".tsv": "excel",
        ".docx": "docx",
        ".doc": "docx",
        ".mp3": "audio",
        ".wav": "audio",
        ".ogg": "audio",
        ".m4a": "audio",
        ".txt": "text",
        ".md": "text",
        ".json": "text",
        ".xml": "text",
    }

    CONTENT_KEYWORDS = {
        "legal": [
            "agreement",
            "contract",
            "lease",
            "rental",
            "tenant",
            "landlord",
            "stamp duty",
            "registration",
            "property",
            "deed",
            "power of attorney",
            "maharashtra rent control",
            "transfer of property",
            "section",
            "act",
            "notice",
            "notice period",
            "eviction",
            "petition",
            "suit",
            "plaintiff",
            "defendant",
            "court",
            "tribunal",
            "order",
            "judgment",
            "compliance",
        ],
        "financial": [
            "balance sheet",
            "profit and loss",
            "p&l",
            "income statement",
            "invoice",
            "receipt",
            "payment",
            "bank statement",
            "transaction",
            "credit",
            "debit",
            "gst",
            "tax",
            "tds",
            "billing",
            "receivables",
            "payables",
            "ledger",
            "trial balance",
            "audit",
            "anomaly",
        ],
    }

    async def process(
        self,
        *,
        text: str = "",
        file_bytes: Optional[bytes] = None,
        filename: str = "",
        mime_type: str = "",
    ) -> RouterResult:
        """Route any input to the right agent.

        Args:
            text: Plain text input (takes priority if non-empty)
            file_bytes: Raw file bytes
            filename: Original filename
            mime_type: MIME type
        Returns:
            RouterResult with extracted text, classification, agent route
        """
        input_type = "text"
        extracted_text = text
        structured_data = {}

        # ── Detect file type ─────────────────────────────────────────────
        if file_bytes and not text:
            input_type = _detect_type(filename, mime_type)
            logger.info("Router detected type: %s (file: %s)", input_type, filename)

            # Route to processor
            extracted_text = await _route_to_processor(input_type, file_bytes, filename)

            # Try structured extraction for documents
            if input_type in ("pdf", "image"):
                structured_data = await _structured_extraction(
                    input_type, file_bytes, filename
                )

        # ── Classify content ─────────────────────────────────────────────
        content_type = _classify_content(extracted_text)
        logger.info("Router classified content: %s", content_type)

        # ── Route to agent ───────────────────────────────────────────────
        agent_name = _route_to_agent(content_type, input_type, extracted_text)

        return RouterResult(
            input_type=input_type,
            content_type=content_type,
            extracted_text=extracted_text,
            structured_data=structured_data,
            agent_name=agent_name,
        )


# ── Helpers ──────────────────────────────────────────────────────────────


def _detect_type(filename: str, mime_type: str = "") -> str:
    """Detect input type from filename extension or MIME."""
    if mime_type:
        main = mime_type.split("/")[0]
        if main in ("image", "audio", "video", "text"):
            return main
        if "pdf" in mime_type:
            return "pdf"
        if "excel" in mime_type or "spreadsheet" in mime_type:
            return "excel"
        if "word" in mime_type or "document" in mime_type:
            return "docx"

    ext = "." + (filename or "").lower().rsplit(".", 1)[-1]
    return AnyInputRouter.EXTENSION_MAP.get(ext, "text")


async def _route_to_processor(input_type: str, file_bytes: bytes, filename: str) -> str:
    """Route to the correct media processor."""
    from media.processors import (
        process_audio,
        process_image,
        process_pdf,
        process_excel,
        process_docx,
        process_text,
    )
    from media.router import process_file

    try:
        return await process_file(file_bytes, filename)
    except Exception:
        pass

    processors = {
        "image": process_image,
        "pdf": process_pdf,
        "audio": process_audio,
        "excel": process_excel,
        "docx": process_docx,
    }
    fn = processors.get(input_type, process_text)
    return await fn(file_bytes, filename)


async def _structured_extraction(
    input_type: str, file_bytes: bytes, filename: str
) -> dict:
    """Try to extract structured fields from documents."""
    try:
        if input_type == "pdf":
            from media.processors import process_pdf_structured

            return await process_pdf_structured(file_bytes, filename)
        elif input_type == "image":
            from media.processors import process_image_structured

            return await process_image_structured(file_bytes, filename)
    except Exception as e:
        logger.error("Structured extraction failed: %s", e)
    return {}


def _classify_content(text: str) -> str:
    """Classify content as legal, financial, or general."""
    if not text:
        return "general"

    text_lower = text.lower()

    legal_score = sum(
        1 for kw in AnyInputRouter.CONTENT_KEYWORDS["legal"] if kw in text_lower
    )
    financial_score = sum(
        1 for kw in AnyInputRouter.CONTENT_KEYWORDS["financial"] if kw in text_lower
    )

    if legal_score > financial_score and legal_score > 2:
        return "legal"
    if financial_score > legal_score and financial_score > 2:
        return "financial"
    return "general"


def _route_to_agent(content_type: str, input_type: str, text: str) -> str:
    """Route content to the most appropriate agent."""
    # Content-based routing
    if content_type == "legal":
        return "vyasa"
    if content_type == "financial":
        if input_type in ("excel", "pdf"):
            return "auditor"
        return "accountant"
    if input_type in ("audio", "image"):
        return "supervisor"  # Let supervisor decide based on content

    # For text, let reasoner handle complex queries
    if len(text) > 500:
        return "reasoner"

    return "supervisor"
