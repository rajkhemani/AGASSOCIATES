"""Any-to-Any Output Generator — multi-format response generation.

Routes agent responses to the right output format based on context:
- Plain text → Telegram/WhatsApp reply
- Structured JSON → API response
- PDF → Binary download
- Audio → TTS voice reply

Usage:
    from agents.output_generator import OutputGenerator
    gen = OutputGenerator()
    result = await gen.generate(agent_response, output_format="telegram")
"""

from __future__ import annotations

import io
import json
import logging
from dataclasses import dataclass
from typing import Optional

logger = logging.getLogger(__name__)


@dataclass
class GeneratedOutput:
    """Output from the generator."""
    format: str  # text, json, pdf, audio
    text: str = ""
    data: bytes = b""
    mime_type: str = "text/plain"
    filename: str = ""


class OutputGenerator:
    """Generate output in any format from agent responses."""

    async def generate(
        self,
        response_text: str,
        *,
        output_format: str = "text",
        response_data: Optional[dict] = None,
        title: str = "AG Associates",
    ) -> GeneratedOutput:
        """Generate output in the requested format.

        Args:
            response_text: The agent's text response
            output_format: Target format (text, json, pdf, audio, telegram)
            response_data: Structured data from the agent
            title: Document title for generated files
        Returns:
            GeneratedOutput with the formatted result
        """
        if output_format in ("text", "telegram", "whatsapp"):
            return self._format_text(response_text, response_data)

        if output_format == "json":
            return self._format_json(response_text, response_data)

        if output_format == "pdf":
            return await self._format_pdf(response_text, title)

        if output_format == "audio":
            return await self._format_audio(response_text)

        # Default: return as text
        return self._format_text(response_text, response_data)

    # ── Formatters ───────────────────────────────────────────────────────

    def _format_text(
        self, text: str, data: Optional[dict] = None
    ) -> GeneratedOutput:
        """Format as plain text (Telegram/WhatsApp)."""
        if data:
            text += "\n\n" + json.dumps(data, indent=2, ensure_ascii=False)
        return GeneratedOutput(format="text", text=text, mime_type="text/plain")

    def _format_json(
        self, text: str, data: Optional[dict] = None
    ) -> GeneratedOutput:
        """Format as structured JSON."""
        result = {
            "response": text,
            "data": data or {},
            "generated_at": __import__("datetime").datetime.now().isoformat(),
        }
        json_bytes = json.dumps(result, indent=2, ensure_ascii=False).encode("utf-8")
        return GeneratedOutput(
            format="json",
            text=text,
            data=json_bytes,
            mime_type="application/json",
            filename="response.json",
        )

    async def _format_pdf(self, text: str, title: str) -> GeneratedOutput:
        """Format as PDF document using ReportLab."""
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib.units import inch
            from reportlab.platypus import (
                SimpleDocTemplate,
                Paragraph,
                Spacer,
                HRFlowable,
            )

            buf = io.BytesIO()
            doc = SimpleDocTemplate(
                buf,
                pagesize=A4,
                rightMargin=50,
                leftMargin=50,
                topMargin=50,
                bottomMargin=50,
                title=title,
            )
            styles = getSampleStyleSheet()
            story = []

            # Title
            story.append(Paragraph(title, styles["Title"]))
            story.append(Spacer(1, 0.2 * inch))
            story.append(HRFlowable(width="100%", thickness=1))
            story.append(Spacer(1, 0.3 * inch))

            # Body text — split by double newlines into paragraphs
            body_style = ParagraphStyle(
                "Body",
                parent=styles["Normal"],
                fontSize=10,
                leading=14,
                spaceAfter=8,
            )
            for para in text.split("\n\n"):
                if para.strip():
                    story.append(Paragraph(para.strip().replace("\n", "<br/>"), body_style))

            doc.build(story)
            return GeneratedOutput(
                format="pdf",
                text=text,
                data=buf.getvalue(),
                mime_type="application/pdf",
                filename=f"{title.lower().replace(' ', '_')}.pdf",
            )
        except ImportError:
            logger.warning("ReportLab not available — returning text")
            return self._format_text(text)
        except Exception as e:
            logger.error("PDF generation failed: %s", e)
            return self._format_text(text)

    async def _format_audio(self, text: str) -> GeneratedOutput:
        """Format as audio using Piper TTS."""
        try:
            from voice.tts import synthesize_speech

            audio_bytes = await synthesize_speech(text)
            if audio_bytes:
                return GeneratedOutput(
                    format="audio",
                    text=text,
                    data=audio_bytes,
                    mime_type="audio/wav",
                    filename="response.wav",
                )
        except ImportError:
            logger.warning("TTS not available — returning text")
        except Exception as e:
            logger.error("TTS failed: %s", e)
        return self._format_text(text)
