"""Individual file-type processors — any-to-any capability.

Each processor takes file bytes + metadata, returns extracted text/structured data.
Vision model support for images and scanned PDFs via LLM_VISION_MODEL.
"""

import base64
import io
import json
import logging
import os

logger = logging.getLogger(__name__)

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")
LLM_VISION_MODEL = os.environ.get("LLM_VISION_MODEL", "gemini-2.0-flash")
LLM_VISION_BASE_URL = os.environ.get(
    "LLM_VISION_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
)
LLM_VISION_API_KEY = os.environ.get(
    "LLM_VISION_API_KEY", os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY", "")
)


async def process_audio(file_bytes: bytes, filename: str = "") -> str:
    """Transcribe audio using Whisper (vLLM audio endpoint).

    Args:
        file_bytes: Audio file content (ogg, mp3, wav, etc.)
        filename: Original filename
    Returns:
        Transcribed text
    """
    import httpx

    url = f"{LLM_BASE_URL}/audio/transcriptions"
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                url,
                files={"file": (filename or "audio.ogg", file_bytes, "audio/ogg")},
                data={"model": "whisper-large-v3"},
            )
            if resp.status_code == 200:
                return resp.json().get("text", "").strip()
            logger.error("Whisper error: %s", resp.text[:200])
            return ""
    except Exception as e:
        logger.error("Audio transcription failed: %s", e)
        return ""


async def process_image(file_bytes: bytes, filename: str = "") -> str:
    """Extract text from image using vision model.

    Uses LLM_VISION_MODEL (default: gemini-2.0-flash) for OCR and visual analysis.
    Falls back to vLLM if vision model is not configured.

    Args:
        file_bytes: Image content (jpg, png, etc.)
        filename: Original filename
    Returns:
        Extracted text description
    """
    import httpx

    b64 = base64.b64encode(file_bytes).decode("utf-8")
    mime = _guess_mime(filename)
    data_url = f"data:{mime};base64,{b64}"

    # Try Gemini-style vision first
    if LLM_VISION_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{LLM_VISION_BASE_URL}/models/{LLM_VISION_MODEL}:generateContent",
                    params={"key": LLM_VISION_API_KEY},
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {
                                        "text": "Analyze this image carefully. Extract all visible text, describe any documents, forms, tables, signatures, or visual elements. Be thorough and structured.",
                                    },
                                    {
                                        "inline_data": {
                                            "mime_type": mime,
                                            "data": b64,
                                        }
                                    },
                                ]
                            }
                        ]
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        return " ".join(p.get("text", "") for p in parts).strip()
                logger.error("Vision error (%d): %s", resp.status_code, resp.text[:200])
        except Exception as e:
            logger.error("Vision Gemini call failed: %s, falling back to vLLM", e)

    # Fallback: vLLM vision endpoint
    payload = {
        "model": os.environ.get("LLM_MODEL_NAME", "qwen2.5-7b-instruct"),
        "messages": [
            {
                "role": "system",
                "content": "Extract all text and important visual information from this image. Be thorough.",
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What does this image contain? Extract all text visible.",
                    },
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions", json=payload
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
            logger.error("vLLM vision error: %s", resp.text[:200])
            return ""
    except Exception as e:
        logger.error("Image processing failed: %s", e)
        return ""


async def process_image_structured(
    file_bytes: bytes,
    filename: str = "",
    *,
    schema_hint: str = "",
) -> dict:
    """Extract structured fields from an image using the vision model.

    Useful for document scans: passports, Aadhaar, bank statements,
    property photos, rental agreements.

    Args:
        file_bytes: Image content
        filename: Original filename
        schema_hint: Optional description of expected fields
    Returns:
        Dict with 'raw_text', 'fields' (structured key-value pairs),
        'document_type', 'confidence'
    """
    raw_text = await process_image(file_bytes, filename)

    if not raw_text:
        return {"raw_text": "", "fields": {}, "document_type": "unknown", "confidence": 0}

    # Use LLM to extract structured fields from the raw vision output
    schema_text = (
        f"Extract fields for: {schema_hint}" if schema_hint
        else "Extract all structured fields from this document image"
    )

    import httpx

    payload = {
        "model": os.environ.get("LLM_MODEL_NAME", "qwen2.5-7b-instruct"),
        "messages": [
            {
                "role": "system",
                "content": (
                    f"{schema_text}. "
                    "Return ONLY valid JSON with keys: fields (dict of key-value pairs), "
                    "document_type (string), confidence (number 0-1). "
                    "If you cannot determine a field, omit it."
                ),
            },
            {
                "role": "user",
                "content": f"Extract structured data from this text:\n\n{raw_text[:3000]}",
            },
        ],
        "max_tokens": 1024,
        "temperature": 0.0,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions", json=payload
            )
            if resp.status_code == 200:
                text = resp.json()["choices"][0]["message"]["content"]
                text = text.strip()
                if text.startswith("```"):
                    text = text.split("\n", 1)[1].rsplit("\n```", 1)[0]
                return json.loads(text)
    except Exception as e:
        logger.error("Structured image extraction failed: %s", e)

    return {
        "raw_text": raw_text[:2000],
        "fields": {},
        "document_type": "unknown",
        "confidence": 0,
    }


async def process_pdf(file_bytes: bytes, filename: str = "") -> str:
    """Extract text from PDF using pdfplumber + OCR fallback for scanned PDFs.

    When pdfplumber returns no text (scanned/image PDF), falls back to
    rendering pages as images and calling process_image() for OCR.

    Args:
        file_bytes: PDF content
        filename: Original filename
    Returns:
        Extracted text
    """
    try:
        import pdfplumber
    except ImportError:
        return "PDF processing library not available."

    texts = []
    table_texts = []
    empty_pages = 0

    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            total_pages = len(pdf.pages)
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    texts.append(f"[Page {i+1}]\n{text}")
                else:
                    empty_pages += 1
                tables = page.extract_tables()
                for table in tables:
                    formatted = _format_table(table)
                    if formatted.strip():
                        table_texts.append(f"[Page {i+1} Table]\n{formatted}")
    except Exception as e:
        logger.error("PDF processing failed: %s", e)
        return f"PDF processing error: {e}"

    full_text = "\n\n".join(texts)
    if table_texts:
        full_text += "\n\n=== TABLES ===\n" + "\n\n".join(table_texts)

    # OCR fallback: if all pages were empty, try rendering + vision
    if not texts and total_pages > 0:
        logger.info(
            "PDF has no extractable text (%d pages scanned). Trying OCR...", total_pages
        )
        ocr_texts = await _pdf_ocr_fallback(file_bytes, max_pages=5)
        if ocr_texts:
            return " [OCR result - scanned PDF]\n".join(ocr_texts)

    return full_text if texts or table_texts else "No text could be extracted from this PDF."


async def process_pdf_structured(
    file_bytes: bytes,
    filename: str = "",
    *,
    extract_fields: bool = True,
) -> dict:
    """Extract text + structured fields from a PDF.

    For legal documents (rental agreements, contracts), extracts
    fields like parties, dates, amounts, clauses.

    Args:
        file_bytes: PDF content
        filename: Original filename
        extract_fields: Whether to run structured field extraction
    Returns:
        Dict with 'full_text', 'fields' (if extract_fields=True),
        'page_count', 'is_scanned'
    """
    raw_text = await process_pdf(file_bytes, filename)
    is_scanned = "OCR result" in raw_text

    result = {
        "full_text": raw_text,
        "page_count": 0,
        "is_scanned": is_scanned,
        "fields": {},
    }

    if not raw_text or "No text" in raw_text:
        return result

    if extract_fields:
        import httpx

        payload = {
            "model": os.environ.get("LLM_MODEL_NAME", "qwen2.5-7b-instruct"),
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a legal document analyzer. Extract structured fields "
                        "from the document text. Return ONLY valid JSON with keys: "
                        "fields (dict of key-value pairs for parties, dates, amounts, "
                        "property details, clauses), document_type (string), "
                        "summary (2-3 sentence summary)."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Extract structured data from this document:\n\n{raw_text[:5000]}",
                },
            ],
            "max_tokens": 1500,
            "temperature": 0.0,
        }

        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    f"{LLM_BASE_URL}/chat/completions", json=payload
                )
                if resp.status_code == 200:
                    text = resp.json()["choices"][0]["message"]["content"]
                    text = text.strip()
                    if text.startswith("```"):
                        text = text.split("\n", 1)[1].rsplit("\n```", 1)[0]
                    extracted = json.loads(text)
                    result["fields"] = extracted.get("fields", {})
                    result["document_type"] = extracted.get("document_type", "")
                    result["summary"] = extracted.get("summary", "")
        except Exception as e:
            logger.error("Structured PDF extraction failed: %s", e)

    return result


async def _pdf_ocr_fallback(file_bytes: bytes, max_pages: int = 5) -> list[str]:
    """Render PDF pages as images and OCR them via vision model."""
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        logger.warning("pdf2image not installed — cannot OCR scanned PDFs")
        return []

    texts = []
    try:
        images = convert_from_bytes(file_bytes, dpi=150, first_page=1, last_page=max_pages)
        for i, img in enumerate(images):
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            page_text = await process_image(buf.getvalue(), f"page_{i+1}.png")
            if page_text:
                texts.append(page_text)
    except Exception as e:
        logger.error("PDF OCR fallback failed: %s", e)

    return texts


async def process_excel(file_bytes: bytes, filename: str = "") -> str:
    """Extract structured data from Excel files.

    Args:
        file_bytes: Excel content (.xlsx/.xls)
        filename: Original filename
    Returns:
        Extracted data as formatted text
    """
    try:
        import openpyxl
    except ImportError:
        return await _process_excel_csv_fallback(file_bytes, filename)

    try:
        wb = openpyxl.load_workbook(
            io.BytesIO(file_bytes), read_only=True, data_only=True
        )
        parts = []
        for sheet_name in wb.sheetnames:
            ws = wb[sheet_name]
            rows = []
            for row in ws.iter_row(min_row=1, values_only=True):
                rows.append("\t".join(str(c) if c is not None else "" for c in row))
            if rows:
                parts.append(f"=== Sheet: {sheet_name} ===\n" + "\n".join(rows))
        wb.close()
        return "\n\n".join(parts) if parts else "Empty Excel file."
    except Exception as e:
        logger.error("Excel processing failed: %s", e)
        return f"Excel processing error: {e}"


async def _process_excel_csv_fallback(file_bytes: bytes, filename: str) -> str:
    """Fallback: read Excel as CSV if openpyxl unavailable."""
    try:
        if filename.lower().endswith(".csv"):
            return file_bytes.decode("utf-8", errors="replace")
        else:
            import pandas as pd
            import io

            dfs = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
            parts = []
            for name, df in dfs.items():
                parts.append(f"=== Sheet: {name} ===\n{df.to_csv(index=False)}")
            return "\n\n".join(parts)
    except ImportError:
        return "Excel processing requires openpyxl or pandas."
    except Exception as e:
        return f"Excel fallback error: {e}"


async def process_docx(file_bytes: bytes, filename: str = "") -> str:
    """Extract text from DOCX files.

    Args:
        file_bytes: DOCX content
        filename: Original filename
    Returns:
        Extracted text
    """
    try:
        from docx import Document
    except ImportError:
        return "DOCX processing library not available."

    try:
        doc = Document(io.BytesIO(file_bytes))
        texts = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(texts) if texts else "Empty document."
    except Exception as e:
        logger.error("DOCX processing failed: %s", e)
        return f"DOCX processing error: {e}"


async def process_text(file_bytes: bytes, filename: str = "") -> str:
    """Read plain text files."""
    try:
        return file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        return f"Text read error: {e}"


def _format_table(table: list[list]) -> str:
    """Format extracted table as TSV."""
    return "\n".join("\t".join(str(c) if c else "" for c in row) for row in table)


def _guess_mime(filename: str) -> str:
    ext = (filename or "").lower().split(".")[-1]
    return {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }.get(ext, "image/png")
