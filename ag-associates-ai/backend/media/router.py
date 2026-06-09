"""Media router — picks the right processor based on file type.

Extensibility: add new processors to PROCESSORS dict with MIME/extension keys.
"""

import logging
from typing import Optional

from . import processors

logger = logging.getLogger(__name__)

EXTENSION_MAP = {
    ".mp3": processors.process_audio,
    ".ogg": processors.process_audio,
    ".wav": processors.process_audio,
    ".m4a": processors.process_audio,
    ".jpg": processors.process_image,
    ".jpeg": processors.process_image,
    ".png": processors.process_image,
    ".gif": processors.process_image,
    ".webp": processors.process_image,
    ".bmp": processors.process_image,
    ".pdf": processors.process_pdf,
    ".xlsx": processors.process_excel,
    ".xls": processors.process_excel,
    ".csv": processors.process_excel,
    ".docx": processors.process_docx,
    ".doc": processors.process_docx,
    ".txt": processors.process_text,
    ".md": processors.process_text,
    ".json": processors.process_text,
    ".xml": processors.process_text,
}

MIME_MAP = {
    "audio/ogg": processors.process_audio,
    "audio/mpeg": processors.process_audio,
    "audio/wav": processors.process_audio,
    "audio/mp4": processors.process_audio,
    "image/jpeg": processors.process_image,
    "image/png": processors.process_image,
    "image/gif": processors.process_image,
    "image/webp": processors.process_image,
    "application/pdf": processors.process_pdf,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": processors.process_excel,
    "application/vnd.ms-excel": processors.process_excel,
    "text/csv": processors.process_excel,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": processors.process_docx,
    "application/msword": processors.process_docx,
    "text/plain": processors.process_text,
    "application/json": processors.process_text,
}


async def process_file(file_bytes: bytes, filename: str = "", mime_type: str = "") -> str:
    """Route file to the appropriate processor.
    
    Args:
        file_bytes: Raw file content
        filename: Original filename (used for extension detection)
        mime_type: MIME type (used if filename ambiguous)
    Returns:
        Extracted text/structured data
    """
    ext = _get_ext(filename)

    processor = EXTENSION_MAP.get(ext) or MIME_MAP.get(mime_type)
    if processor:
        return await processor(file_bytes, filename)

    logger.warning("Unknown file type: ext=%s mime=%s", ext, mime_type)
    return (
        f"Unsupported file type. AG Associates supports:\n"
        f"📊 Excel (.xlsx, .xls, .csv) — Financial audit\n"
        f"📄 PDF (.pdf) — Document reading\n"
        f"📝 Word (.docx) — Document reading\n"
        f"🎵 Audio (.mp3, .ogg, .wav) — Voice transcription\n"
        f"🖼️ Image (.jpg, .png) — OCR text extraction\n"
        f"📋 Text (.txt, .md) — Plain text"
    )


async def process_file_to_json(file_bytes: bytes, filename: str = "", mime_type: str = "") -> dict:
    """Process a file and return structured JSON.
    
    Returns dict with:
        - text: extracted content
        - type: detected file type
        - success: bool
    """
    ext = _get_ext(filename)
    text = await process_file(file_bytes, filename, mime_type)
    return {
        "text": text,
        "type": ext.lstrip(".") if ext else "unknown",
        "filename": filename,
        "success": bool(text and not text.startswith("Unsupported")),
    }


def _get_ext(filename: str) -> str:
    if not filename:
        return ""
    name = filename.lower().strip()
    idx = name.rfind(".")
    return name[idx:] if idx >= 0 else ""
