"""Individual file-type processors.

Each processor takes file bytes + metadata, returns extracted text/structured data.
"""

import csv
import io
import json
import logging
import os
import re
import tempfile
from typing import Any, Optional

logger = logging.getLogger(__name__)

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "")


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
    """Extract text from image using OCR via LLM vision.
    
    Args:
        file_bytes: Image content (jpg, png, etc.)
        filename: Original filename
    Returns:
        Extracted text description
    """
    import base64
    import httpx

    b64 = base64.b64encode(file_bytes).decode("utf-8")
    mime = _guess_mime(filename)
    data_url = f"data:{mime};base64,{b64}"

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
                    {"type": "text", "text": "What does this image contain? Extract all text visible."},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        "max_tokens": 1024,
    }

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                json=payload,
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"]
            logger.error("Vision error: %s", resp.text[:200])
            return ""
    except Exception as e:
        logger.error("Image processing failed: %s", e)
        return ""


async def process_pdf(file_bytes: bytes, filename: str = "") -> str:
    """Extract text from PDF using pdfplumber.
    
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

    import io
    texts = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    texts.append(text)
                tables = page.extract_tables()
                for table in tables:
                    texts.append(_format_table(table))
        return "\n\n".join(texts) if texts else "No text could be extracted from this PDF."
    except Exception as e:
        logger.error("PDF processing failed: %s", e)
        return f"PDF processing error: {e}"


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

    import io
    try:
        wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
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
            text = file_bytes.decode("utf-8", errors="replace")
        else:
            import pandas as pd
            import io
            dfs = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
            parts = []
            for name, df in dfs.items():
                parts.append(f"=== Sheet: {name} ===\n{df.to_csv(index=False)}")
            return "\n\n".join(parts)
    except ImportError:
        return f"Excel processing requires openpyxl or pandas."
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

    import io
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
