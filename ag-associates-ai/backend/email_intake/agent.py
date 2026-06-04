import asyncio
import email
import imaplib
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional, Tuple

import httpx
from pydantic import BaseModel

from noi_agent import noi_agent

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

# ── Configuration ─────────────────────────────────────────────────────────

IMAP_SERVER = os.environ.get("IMAP_SERVER", "imap.zoho.in")
IMAP_PORT = int(os.environ.get("IMAP_PORT", "993"))
IMAP_USER = os.environ.get("ZOHO_EMAIL_USER", "admin@advadiityagade.com")
IMAP_PASS = os.environ.get("ZOHO_EMAIL_PASS", "")

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_MODEL = os.environ.get("LLM_MODEL_NAME", "qwen2.5-7b-instruct")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "not-needed")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

POLL_INTERVAL_SECONDS = int(os.environ.get("INTAKE_POLL_INTERVAL", "60"))
INTAKE_PORT = int(os.environ.get("INTAKE_PORT", "3002"))

WHITELISTED_DOMAINS = [
    "idbi.com",
    "hdfcbank.com",
    "icicibank.com",
    "sbi.co.in",
    "axisbank.com",
    "kotak.com",
    "advadiityagade.com",
]


class SanctionExtraction(BaseModel):
    borrower_name: str
    loan_amount: float
    bank_name: str
    property_address: Optional[str] = None
    property_city: Optional[str] = None
    loan_ref_number: Optional[str] = None
    confidence: float = 0.0


async def fetch_new_emails() -> List[Dict[str, Any]]:
    if not IMAP_PASS:
        logger.warning("ZOHO_EMAIL_PASS not set; email intake idle")
        return []
    emails = []
    try:
        mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
        mail.login(IMAP_USER, IMAP_PASS)
        mail.select("inbox")
        status, response = mail.search(None, "UNSEEN")
        if status != "OK":
            return []
        for m_id in response[0].split():
            status, msg_data = mail.fetch(m_id, "(RFC822)")
            if status != "OK":
                continue
            msg = email.message_from_bytes(msg_data[0][1])
            sender = msg.get("From", "")
            subject = msg.get("Subject", "")
            domain = sender.split("@")[-1].strip(">").lower()
            if not any(d in domain for d in WHITELISTED_DOMAINS):
                continue
            body = ""
            attachments = []
            if msg.is_multipart():
                for part in msg.walk():
                    content_disposition = str(part.get("Content-Disposition"))
                    if (
                        part.get_content_type() == "text/plain"
                        and "attachment" not in content_disposition
                    ):
                        payload = part.get_payload(decode=True)
                        if payload:
                            body += payload.decode(errors="ignore")
                    elif "attachment" in content_disposition:
                        filename = part.get_filename()
                        if filename:
                            attachments.append(
                                {
                                    "filename": filename,
                                    "content_type": part.get_content_type(),
                                    "payload": part.get_payload(decode=True),
                                }
                            )
            else:
                payload = msg.get_payload(decode=True)
                if payload:
                    body = payload.decode(errors="ignore")
            emails.append(
                {
                    "id": m_id,
                    "sender": sender,
                    "subject": subject,
                    "body": body,
                    "attachments": attachments,
                }
            )
        mail.logout()
    except Exception as e:
        logger.error("IMAP error: %s", e)
    return emails


async def extract_loan_details(
    body: str, sender: str, subject: str
) -> Optional[SanctionExtraction]:
    system_prompt = "Extract home loan details as JSON: borrower_name, loan_amount (float), bank_name, property_address, property_city, loan_ref_number, confidence (0.0-1.0)."
    prompt = f"Sender: {sender}\nSubject: {subject}\n\nBody:\n{body[:4000]}"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "response_format": {"type": "json_object"},
                },
                headers={"Authorization": f"Bearer {LLM_API_KEY}"},
            )
            resp.raise_for_status()
            content = (
                resp.json()["choices"][0]["message"]["content"]
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return SanctionExtraction(**json.loads(content))
    except Exception as e:
        logger.error("LLM extraction failed: %s", e)
        return None


async def create_case(
    extract: SanctionExtraction, sender_email: str, attachments: list = None
) -> Optional[str]:
    if not SUPABASE_URL:
        return None
    noi_related = True
    payment_found = False
    document_types = []
    if attachments:
        for att in attachments:
            fname = att["filename"].lower()
            if any(k in fname for k in ["payment", "receipt", "challan", "utr"]):
                payment_found = True
            if any(
                k in fname for k in ["sanction", "index", "draft", "aadhaar", "pan"]
            ):
                document_types.append(fname)
    initial_status = "RECEIVED"
    if payment_found:
        initial_status = "ASSIGNED"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/cases",
                json={
                    "case_type": "INTIMATION_MORTGAGE",
                    "case_status": initial_status,
                    "bank_name": extract.bank_name,
                    "borrower_name": extract.borrower_name,
                    "loan_amount": extract.loan_amount,
                    "loan_ref": extract.loan_ref_number or "",
                    "property_address": extract.property_address or "",
                    "property_city": extract.property_city or "",
                    "source": "email_intake",
                    "source_email": sender_email,
                    "metadata": {
                        **extract.model_dump(),
                        "noi_related": noi_related,
                        "payment_related": payment_found,
                        "document_types": document_types,
                        "attachments_count": len(attachments) if attachments else 0,
                    },
                },
                headers={
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                },
            )
            resp.raise_for_status()
            result = resp.json()
            case_id = (
                result[0]["id"]
                if isinstance(result, list) and len(result) > 0
                else result.get("id")
            )
            return str(case_id)
    except Exception as e:
        logger.error("Supabase case creation failed: %s", e)
        return None


async def extract_payment_from_image(image_base64: str) -> Optional[dict]:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "Extract payment details as JSON: utr_number, amount, date.",
                        },
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Extract payment details:"},
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": f"data:image/jpeg;base64,{image_base64}"
                                    },
                                },
                            ],
                        },
                    ],
                    "temperature": 0.1,
                },
                headers={"Authorization": f"Bearer {LLM_API_KEY}"},
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"]
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            return json.loads(json_match.group(0)) if json_match else None
    except Exception as e:
        logger.error("Payment OCR failed: %s", e)
        return None


async def process_payment_attachments(
    case_id: str, attachments: list
) -> Tuple[bool, Optional[dict]]:
    payment_info = None
    for att in attachments:
        filename = att.get("filename", "").lower()
        if any(
            keyword in filename
            for keyword in ["payment", "receipt", "utr", "screenshot"]
        ) and att.get("content_type", "").startswith("image/"):
            import base64

            payment_info = await extract_payment_from_image(
                base64.b64encode(att.get("payload")).decode("utf-8")
            )
            if payment_info:
                break
    return payment_info is not None, payment_info


async def poll_once() -> int:
    emails = await fetch_new_emails()
    if not emails:
        return 0
    created = 0
    for mail in emails:
        extract = await extract_loan_details(
            mail["body"], mail["sender"], mail["subject"]
        )
        if extract is None or extract.confidence < 0.3:
            continue
        case_id = await create_case(extract, mail["sender"], mail.get("attachments"))
        if case_id:
            attachments = mail.get("attachments", [])
            payment_found = False
            if attachments:
                payment_found, payment_info = await process_payment_attachments(
                    case_id, attachments
                )
                if payment_found and payment_info:
                    try:
                        async with httpx.AsyncClient() as client:
                            await client.patch(
                                f"{SUPABASE_URL}/rest/v1/cases?id=eq.{case_id}",
                                json={
                                    "payment_utr": payment_info.get("utr_number"),
                                    "payment_amount": payment_info.get("amount"),
                                    "payment_date": payment_info.get("date"),
                                    "payment_status": "RECEIVED",
                                    "payment_metadata": payment_info,
                                },
                                headers={
                                    "apikey": SUPABASE_SERVICE_KEY,
                                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                                    "Content-Type": "application/json",
                                },
                            )
                    except Exception as e:
                        logger.warning("Failed to update payment info: %s", e)
            created += 1
            try:
                if payment_found:
                    await noi_agent.run_workflow(case_id=case_id, action="verify_docs")
            except Exception as e:
                logger.warning("NOI trigger failed: %s", e)
    return created


async def run_poller():
    logger.info("Email Intake Agent started")
    while True:
        try:
            await poll_once()
        except Exception as e:
            logger.error("Poll cycle error: %s", e)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


async def health_server():
    import http.server
    import socketserver

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status":"ok","agent":"email_intake"}')

    with socketserver.TCPServer(("0.0.0.0", INTAKE_PORT), H) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    asyncio.run(run_poller())
