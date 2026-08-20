"""Email Intake Agent — monitors bank email inbox, extracts loan sanction details,
creates cases in Supabase with INTIMATION_MORTGAGE type.

Flow:
  1. Poll IMAP inbox for new emails from known bank domains
  2. Parse email body + attachments using LLM
  3. Extract: borrower name, loan amount, bank, property details, loan ref
  4. Create case in Supabase with status PENDING_INTAKE
  5. Log action to Redis for dashboard visibility
"""

import json
import os
import logging
import asyncio
import imaplib
import email
import re
from collections import deque
from email.header import decode_header
from typing import Optional, Tuple

import httpx
from pydantic import BaseModel, Field

# Import NOI agent for workflow automation
from noi_agent import noi_agent

from email_intake.panel import Recognition, configured_domains, recognise

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")

# ── Config ───────────────────────────────────────────────────────────────

# Zoho Mail Configuration
IMAP_HOST = os.environ.get("EMAIL_IMAP_HOST", "imap.zoho.in")
IMAP_PORT = int(os.environ.get("EMAIL_IMAP_PORT", "993"))
IMAP_USER = os.environ.get("EMAIL_IMAP_USER", "admin@advadiityagade.com")
# No default. A hardcoded fallback here previously held a live Zoho app
# password, which meant a missing secret looked like a working deployment
# instead of failing loudly. An unset value now stops the poller at startup.
IMAP_PASS = os.environ.get("EMAIL_IMAP_PASS", "")
IMAP_INBOX = os.environ.get("EMAIL_IMAP_INBOX", "INBOX")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
# For email intake, we determine org_id from the sender's bank domain
# The org_id will be passed as X-Org-ID header for RLS

LLM_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:8000/v1")
LLM_MODEL = os.environ.get("LLM_MODEL_NAME", "Qwen/Qwen2.5-7B-Instruct")
LLM_API_KEY = os.environ.get("LLM_API_KEY", "not-needed")

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "")

POLL_INTERVAL_SECONDS = int(os.environ.get("EMAIL_POLL_INTERVAL", "60"))
INTAKE_PORT = int(os.environ.get("EMAIL_INTAKE_PORT", "3004"))

# Recognised senders now live in email_intake/panel.py, keyed to the firm's
# published panel and overridable via BANK_EMAIL_DOMAINS. The list that stood
# here named institutions the firm does not act for and omitted three that it
# does.

#: A recent-activity window, NOT the system of record.
#:
#: The mailbox is the system of record. A passed-over message is fetched with
#: BODY.PEEK[] and never flagged, so it stays UNSEEN: the next poll finds it
#: again and a human sees it unread in the inbox. That is what actually keeps
#: it. This deque only lets the health endpoint report a count without reading
#: the log, so it is bounded — an unbounded queue in a long-lived poller is a
#: memory leak — and process-local. Losing it on restart loses nothing, because
#: the mail is still sitting unread where it arrived.
_REVIEW_LIMIT = 50
_awaiting_review: deque[dict] = deque(maxlen=_REVIEW_LIMIT)

#: Message-IDs already noted this run. Because a passed-over message stays
#: UNSEEN deliberately, every poll re-reads it; without this a single stranger's
#: email would refill the whole window every minute and evict the others.
#: Bounded for the same reason the deque is.
_noted: deque[str] = deque(maxlen=_REVIEW_LIMIT * 10)


def set_aside_for_review(
    sender: str, subject: str, received: str, reason: str, message_id: str = ""
) -> None:
    """Hold an unrecognised message for a human instead of discarding it.

    Recording this is the whole point: an incomplete domain list should show up
    as something someone can act on, not as mail that never arrived. The
    message is left unread in the mailbox; this only notes that it was passed
    over and why.

    Repeat sightings of the same message are ignored, keyed on ``Message-ID``.
    A message with no ``Message-ID`` is noted every time rather than dropped —
    a duplicate in the window is a much smaller problem than a silence.
    """
    if message_id and message_id in _noted:
        return
    if message_id:
        _noted.append(message_id)

    _awaiting_review.append(
        {
            "sender": sender,
            "subject": subject,
            "received": received,
            "reason": reason,
        }
    )
    logger.warning(
        "Unrecognised sender passed over, message left unread in the mailbox "
        "(%s): %s — %r",
        reason,
        sender,
        subject,
    )


def review_backlog() -> list[dict]:
    """Recently passed-over messages, oldest first.

    Carries sender and subject, so it must not be served on an unauthenticated
    endpoint — a sanction-letter subject line routinely names the borrower.
    """
    return list(_awaiting_review)


def review_backlog_size() -> int:
    """How many messages were recently passed over. Safe to expose."""
    return len(_awaiting_review)


# ── Schema ───────────────────────────────────────────────────────────────


class LoanSanctionExtract(BaseModel):
    borrower_name: str = Field(description="Full name of the borrower")
    loan_amount: str = Field(description="Loan amount in INR (e.g., ₹45,00,000)")
    bank_name: str = Field(
        description="Name of the lender as written in the sanction letter"
    )
    loan_ref_number: Optional[str] = Field(
        None, description="Loan reference or application number"
    )
    property_address: Optional[str] = Field(
        None, description="Property address if mentioned"
    )
    property_city: Optional[str] = Field(None, description="Property city/town")
    case_type: str = Field(
        default="INTIMATION_MORTGAGE", description="Case type from enum"
    )
    confidence: float = Field(
        default=1.0, description="How confident the extraction is (0-1)"
    )
    raw_summary: str = Field(
        default="", description="Brief summary of the email content"
    )


# ── IMAP Poller ──────────────────────────────────────────────────────────


def decode_str(s):
    """Decode email header string."""
    if s is None:
        return ""
    decoded_parts = decode_header(s)
    result = []
    for part, charset in decoded_parts:
        if isinstance(part, bytes):
            try:
                result.append(part.decode(charset or "utf-8", errors="replace"))
            except LookupError:
                result.append(part.decode("utf-8", errors="replace"))
        else:
            result.append(str(part))
    return " ".join(result)


def is_bank_email(sender_email: str) -> bool:
    """True if the sender is a recognised panel client.

    Retained as a thin wrapper over `panel.recognise` so the recognition rules
    live in one place. Note that a False result no longer means "discard" —
    see the caller in `fetch_new_emails`.
    """
    return recognise(sender_email) == Recognition.KNOWN


async def fetch_new_emails() -> list[dict]:
    """Connect to IMAP and fetch unseen emails from known bank senders."""
    if not IMAP_USER or not IMAP_PASS:
        logger.warning("IMAP credentials not configured")
        return []

    emails_raw = []

    def _drain(mail):
        """Read UNSEEN mail and flag what was handed on.

        The caller owns the connection, so that closing it does not depend on
        this returning normally.
        """
        mail.select(IMAP_INBOX)

        # UID commands throughout, never sequence numbers. A sequence number
        # identifies a message only until the mailbox is renumbered, and an
        # EXPUNGE — the advocate deleting a mail in webmail while this runs —
        # renumbers it. The flagging pass below would then mark a different
        # message read: an unprocessed client email, silently. A UID does not
        # move.
        _, data = mail.uid("SEARCH", None, "UNSEEN")
        handled_uids = set()

        for num in data[0].split():
            if not num:
                continue
            # BODY.PEEK[], never RFC822. Fetching RFC822 sets \Seen as a side
            # effect (RFC 3501), which would mark a message read merely for
            # having been looked at — including one this poller then passes
            # over. The next UNSEEN search would not return it, so an
            # unrecognised message would be read, unprocessed and invisible.
            # \Seen is set explicitly below, and only for messages handled.
            _, msg_data = mail.uid("FETCH", num, "(BODY.PEEK[])")
            for response_part in msg_data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    sender = decode_str(msg.get("From", ""))
                    subject = decode_str(msg.get("Subject", ""))
                    date_str = decode_str(msg.get("Date", ""))

                    # Extract sender email
                    sender_match = re.search(r"<([^>]+@[^>]+)>", sender) or re.search(
                        r"([\w.-]+@[\w.-]+)", sender
                    )
                    sender_email = sender_match.group(1) if sender_match else sender

                    # Recognition decides how a message is handled, never
                    # whether. Anything unrecognised is set aside for a human
                    # rather than discarded — the previous `continue` here
                    # silently dropped mail from panel clients whose domain
                    # was missing from the list.
                    recognition = recognise(sender_email)
                    if recognition != Recognition.KNOWN:
                        set_aside_for_review(
                            sender=sender_email,
                            subject=subject,
                            received=date_str,
                            reason=recognition,
                            message_id=decode_str(msg.get("Message-ID", "")),
                        )
                        continue

                    # Extract body and attachments
                    body = ""
                    attachments = []

                    if msg.is_multipart():
                        for part in msg.walk():
                            content_type = part.get_content_type()
                            disposition = part.get("Content-Disposition", "")

                            if (
                                content_type == "text/plain"
                                and "attachment" not in disposition
                            ):
                                try:
                                    body += part.get_payload(decode=True).decode(
                                        "utf-8", errors="replace"
                                    )
                                except Exception:
                                    pass
                            elif (
                                content_type == "text/html"
                                and "attachment" not in disposition
                            ):
                                try:
                                    body += part.get_payload(decode=True).decode(
                                        "utf-8", errors="replace"
                                    )
                                except Exception:
                                    pass
                            elif "attachment" in disposition:
                                # Handle attachments
                                filename = part.get_filename()
                                if filename:
                                    filename = decode_str(filename)
                                    payload = part.get_payload(decode=True)
                                    attachments.append(
                                        {
                                            "filename": filename,
                                            "content_type": content_type,
                                            "payload": payload,
                                        }
                                    )
                    else:
                        try:
                            body = msg.get_payload(decode=True).decode(
                                "utf-8", errors="replace"
                            )
                        except Exception:
                            body = str(msg.get_payload())

                    handled_uids.add(num)
                    emails_raw.append(
                        {
                            "sender": sender_email,
                            "subject": subject,
                            "date": date_str,
                            "body": body[:5000],  # truncate for LLM
                            "attachments": attachments,
                        }
                    )

        # Mark read only what was actually handed on for processing. Anything
        # passed over stays UNSEEN, so it comes back on the next poll and a
        # human sees it as unread in the mailbox — the mailbox, not the
        # in-process queue, is what keeps it.
        for num in handled_uids:
            try:
                mail.uid("STORE", num, "+FLAGS", "\\Seen")
            except Exception:
                # Failing to flag risks the case being created twice; failing
                # to say so risks nobody knowing why.
                logger.exception("Could not mark message %r read", num)

        return list(handled_uids)

    def _fetch():
        # The teardown is in a finally because the poller runs every sixty
        # seconds forever: a fetch that raises must still give the connection
        # back, or repeated failures walk the mailbox into its connection
        # limit and the intake stops entirely.
        mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
        mail.login(IMAP_USER, IMAP_PASS)
        try:
            return _drain(mail)
        finally:
            try:
                # Only legal with a mailbox selected, so it fails when SELECT
                # was what raised. logout() still has to happen.
                mail.close()
            except Exception:
                logger.debug("IMAP close failed", exc_info=True)
            mail.logout()

    try:
        seen = await asyncio.to_thread(_fetch)
        logger.info("Fetched %d new bank emails", len(seen))
    except Exception as e:
        logger.error("IMAP fetch failed: %s", e)
        return []

    return emails_raw


# ── LLM Extraction ───────────────────────────────────────────────────────


async def extract_loan_details(
    email_text: str, sender: str, subject: str, attachments: list = None
) -> Optional[LoanSanctionExtract]:
    """Extract loan sanction details from bank email and attachments."""
    attachment_descriptions = []

    if attachments:
        for att in attachments:
            filename = att.get("filename", "").lower()
            content_type = att.get("content_type", "")

            # Check for payment-related attachments
            if any(
                keyword in filename
                for keyword in [
                    "payment",
                    "receipt",
                    "utr",
                    "screenshot",
                    "scan",
                    "photo",
                ]
            ):
                if content_type.startswith("image/") or filename.endswith(
                    (".png", ".jpg", ".jpeg", ".pdf")
                ):
                    attachment_descriptions.append(f"PAYMENT_ATTACHMENT: {filename}")
                    # For payment screenshots, we'll do OCR later

            # Check for document attachments
            elif any(
                keyword in filename
                for keyword in [
                    "sanction",
                    "noc",
                    "approval",
                    "loan",
                    "property",
                    "kyc",
                    "pan",
                    "aadhar",
                ]
            ):
                if content_type.startswith("image/") or filename.endswith(
                    (".png", ".jpg", ".jpeg", ".pdf")
                ):
                    attachment_descriptions.append(f"DOCUMENT_ATTACHMENT: {filename}")
                elif content_type == "application/pdf":
                    attachment_descriptions.append(f"PDF_DOCUMENT: {filename}")

            # Generic attachment description
            if filename not in [
                desc.split(": ", 1)[-1]
                for desc in attachment_descriptions
                if ": " in desc
            ]:
                attachment_descriptions.append(f"ATTACHMENT: {filename}")

    attachment_text = ""
    if attachment_descriptions:
        attachment_text = "\n\nAttachments: " + "; ".join(attachment_descriptions)

    prompt = f"""Extract loan sanction details from this bank email and attachments.

Sender: {sender}
Subject: {subject}

Email content:
{email_text[:4000]}{attachment_text}

Instructions:
1. Extract the core loan sanction details from the email body
2. For payment attachments: Note if payment receipt/screenshot is present (will be processed separately for OCR)
3. For document attachments: Note what type of document is attached (sanction letter, NOC, KYC, etc.)
4. If unsure about any field, set confidence low (0.3-0.5)
5. Return JSON only with the specified fields

Return JSON only with fields: borrower_name, loan_amount, bank_name, loan_ref_number, property_address, property_city, case_type, confidence, raw_summary.
Use INTIMATION_MORTGAGE as default case_type.
"""

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You extract structured loan sanction data from bank emails. "
                            "Return JSON only with fields: borrower_name, loan_amount, bank_name, "
                            "loan_ref_number, property_address, property_city, case_type, confidence, raw_summary. "
                            "Use INTIMATION_MORTGAGE as default case_type. "
                            "Set confidence low (0.3-0.5) if unsure about any field.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 500,
                },
                headers={"Authorization": f"Bearer {LLM_API_KEY}"},
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            # Try to extract JSON from response
            import re as regex

            json_match = regex.search(r"\{.*\}", content, regex.DOTALL)
            if json_match:
                return LoanSanctionExtract.model_validate_json(json_match.group(0))
            else:
                logger.warning("No JSON in LLM response: %s", content[:200])
                return None

    except Exception as e:
        logger.error("LLM extraction failed: %s", e)
        return None


# ── Supabase Case Creation ───────────────────────────────────────────────


async def _get_org_id_for_bank(bank_name: str) -> Optional[str]:
    """Look up organization ID by bank name."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{SUPABASE_URL}/rest/v1/organizations",
                params={"name": f"eq.{bank_name}", "select": "id"},
                headers={
                    "apikey": SUPABASE_ANON_KEY,
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                },
            )
            resp.raise_for_status()
            orgs = resp.json()
            return orgs[0]["id"] if orgs else None
    except Exception as e:
        logger.warning("Failed to look up org_id for bank %s: %s", bank_name, e)
        return None


def _get_supabase_headers(org_id: Optional[str] = None) -> Dict[str, str]:
    """Build Supabase REST API headers using anon key + optional org_id."""
    if not SUPABASE_ANON_KEY:
        raise RuntimeError("SUPABASE_ANON_KEY not configured")
    
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
        "Content-Type": "application/json",
    }
    if org_id:
        headers["X-Org-ID"] = org_id
    return headers


async def create_case(
    extract: LoanSanctionExtract, sender_email: str, attachments: list = None
) -> Optional[str]:
    """Create a new case in Supabase with NOI workflow initialization."""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        logger.warning("Supabase not configured — skipping case creation")
        return None

    # Determine org_id from bank name for RLS
    org_id = await _get_org_id_for_bank(extract.bank_name)
    if not org_id:
        logger.warning("No organization found for bank %s — skipping case creation", extract.bank_name)
        return None

    # Determine initial case type and status based on email content
    case_type = extract.case_type
    initial_status = "PENDING_INTAKE"

    # Check attachments for NOI-related documents
    noi_related = False
    payment_related = False
    document_types = []

    if attachments:
        for att in attachments:
            filename = att.get("filename", "").lower()
            att.get("content_type", "")

            # Check for NOI/document attachments
            if any(
                keyword in filename
                for keyword in ["sanction", "noc", "approval", "loan", "property"]
            ):
                noi_related = True
                if "sanction" in filename:
                    document_types.append("SANCTION_LETTER")
                elif "noc" in filename:
                    document_types.append("NOC")
                elif "property" in filename:
                    document_types.append("PROPERTY_DOCS")

            # Check for payment attachments
            if any(
                keyword in filename
                for keyword in ["payment", "receipt", "utr", "screenshot", "scan"]
            ):
                payment_related = True
                document_types.append("PAYMENT_RECEIPT")

    # If we have sanction letter or property docs, we might be further along
    if noi_related:
        initial_status = "DOCUMENTS_RECEIVED"  # NOI state

    try:
        async with httpx.AsyncClient() as client:
            headers = _get_supabase_headers(org_id)
            resp = await client.post(
                f"{SUPABASE_URL}/rest/v1/cases",
                json={
                    "case_type": case_type,
                    "status": initial_status,
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
                        "payment_related": payment_related,
                        "document_types": document_types,
                        "attachments_count": len(attachments) if attachments else 0,
                    },
                },
                headers=headers,
            )
            resp.raise_for_status()
            result = resp.json()
            case_id = (
                result[0]["id"]
                if isinstance(result, list) and len(result) > 0
                else result.get("id")
            )
            logger.info(
                "Created case %s for %s (%s) with status %s (org_id: %s)",
                case_id,
                extract.borrower_name,
                extract.bank_name,
                initial_status,
                org_id,
            )
            return str(case_id)
    except Exception as e:
        logger.error("Supabase case creation failed: %s", e)
        return None


# ── Main Polling Loop ────────────────────────────────────────────────────


async def poll_once() -> int:
    """Fetch new emails, extract, create cases. Returns count of cases created."""
    emails = await fetch_new_emails()
    if not emails:
        return 0

    created = 0
    for mail in emails:
        extract = await extract_loan_details(
            mail["body"], mail["sender"], mail["subject"]
        )
        if extract is None or extract.confidence < 0.3:
            logger.info(
                "Low confidence extraction for email from %s — skipping", mail["sender"]
            )
            continue

        case_id = await create_case(extract, mail["sender"], mail.get("attachments"))
        if case_id:
            # Process payment attachments if any
            attachments = mail.get("attachments", [])
            if attachments:
                payment_found, payment_info = await process_payment_attachments(
                    case_id, attachments
                )
                if payment_found and payment_info:
                    logger.info(
                        "Payment info extracted for case %s: %s", case_id, payment_info
                    )
                    # Update case with payment info
                    try:
                        async with httpx.AsyncClient() as client:
                            org_id = await _get_org_id_for_bank(extract.bank_name)
                            if org_id:
                                headers = _get_supabase_headers(org_id)
                                await client.patch(
                                    f"{SUPABASE_URL}/rest/v1/cases?id=eq.{case_id}",
                                    json={
                                        "payment_utr": payment_info.get("utr_number"),
                                        "payment_amount": payment_info.get("amount"),
                                        "payment_date": payment_info.get("date"),
                                        "payment_status": "RECEIVED",
                                        "payment_metadata": payment_info,
                                    },
                                    headers=headers,
                                )
                            else:
                                logger.warning("Cannot update payment info: no org_id for bank %s", extract.bank_name)
                    except Exception as e:
                        logger.warning(
                            "Failed to update payment info for case %s: %s", case_id, e
                        )

            created += 1

            # Trigger NOI workflow if we have enough info
            try:
                # If we received documents or payment, verify docs next
                # Re-check if any attachments are noi-related
                noi_related_in_poll = False
                if attachments:
                    for att in attachments:
                        fname = att.get("filename", "").lower()
                        if any(
                            k in fname
                            for k in ["sanction", "noc", "approval", "loan", "property"]
                        ):
                            noi_related_in_poll = True
                            break

                if noi_related_in_poll or payment_found:
                    workflow_result = await noi_agent.run_workflow(
                        case_id=case_id, action="verify_docs"
                    )
                    if workflow_result.get("success"):
                        logger.info(
                            "Triggered NOI doc verification for case %s", case_id
                        )
                    else:
                        logger.warning(
                            "Failed to trigger NOI verification for case %s: %s",
                            case_id,
                            workflow_result.get("error"),
                        )
            except Exception as e:
                logger.warning(
                    "NOI workflow trigger failed for case %s: %s", case_id, e
                )

    return created


async def process_payment_attachments(
    case_id: str, attachments: list
) -> Tuple[bool, Optional[dict]]:
    """Process payment-related attachments (screenshots, receipts) using OCR."""
    if not attachments:
        return False, None

    payment_info = None

    for att in attachments:
        filename = att.get("filename", "").lower()
        content_type = att.get("content_type", "")
        payload = att.get("payload")

        # Check if this looks like a payment receipt/screenshot
        if any(
            keyword in filename
            for keyword in ["payment", "receipt", "utr", "screenshot", "scan"]
        ) and (
            content_type.startswith("image/")
            or filename.endswith((".png", ".jpg", ".jpeg", ".pdf"))
        ):
            try:
                # Process image with OCR using LLM (Gemini Vision)
                if content_type.startswith("image/"):
                    # Convert payload to base64 for LLM
                    import base64

                    image_base64 = base64.b64encode(payload).decode("utf-8")

                    # Use LLM to extract payment info from image
                    payment_info = await extract_payment_from_image(image_base64)
                    if payment_info:
                        break  # Found payment info, no need to check other attachments
                elif filename.endswith(".pdf"):
                    # For PDF, we'd need to extract text first - simplified for now
                    logger.info("PDF payment attachment found: %s", filename)
                    # TODO: Implement PDF text extraction + OCR

            except Exception as e:
                logger.warning("OCR processing failed for %s: %s", filename, e)
                continue

    return payment_info is not None, payment_info


async def extract_payment_from_image(image_base64: str) -> Optional[dict]:
    """Extract payment details from image using LLM vision capabilities."""
    try:
        # Use the same LLM but with image input
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{LLM_BASE_URL}/chat/completions",
                json={
                    "model": LLM_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a payment OCR specialist. Extract payment details from screenshots or receipts. Return JSON with: utr_number, amount, date, sender_account, recipient, payment_mode. If unsure about any field, set value to null.",
                        },
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "Extract payment details from this image:",
                                },
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
                    "max_tokens": 500,
                },
                headers={"Authorization": f"Bearer {LLM_API_KEY}"},
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]

            # Try to extract JSON from response
            import re as regex

            json_match = regex.search(r"\{.*\}", content, regex.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                logger.warning("No JSON in payment OCR response: %s", content[:200])
                return None

    except Exception as e:
        logger.error("Payment OCR extraction failed: %s", e)
        return None


async def run_poller():
    """Continuous polling loop."""
    logger.info("Email Intake Agent started — polling every %ds", POLL_INTERVAL_SECONDS)
    while True:
        try:
            count = await poll_once()
            if count:
                logger.info("Created %d cases from bank emails", count)
        except Exception as e:
            logger.error("Poll cycle error: %s", e)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)


# ── Health endpoint (for Docker HEALTHCHECK) ─────────────────────────────


async def health_server():
    import http.server
    import socketserver

    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            # Counts only. This endpoint backs the Docker HEALTHCHECK and is
            # unauthenticated, so it must not carry message metadata: the
            # subject line of a sanction-letter email routinely contains the
            # borrower's name and the loan reference. The number is enough to
            # notice a growing backlog; the detail stays in the container log,
            # which is already access-controlled.
            body = json.dumps(
                {
                    "status": "ok",
                    "agent": "email_intake",
                    "awaiting_review": review_backlog_size(),
                    "recognised_domain_count": len(configured_domains()),
                }
            ).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def log_message(self, *args):
            """Silence per-request logging; the healthcheck polls constantly."""

    with socketserver.TCPServer(("0.0.0.0", INTAKE_PORT), H) as httpd:
        httpd.serve_forever()


# ── Entry ────────────────────────────────────────────────────────────────


async def main():
    asyncio.create_task(health_server())
    await run_poller()


if __name__ == "__main__":
    asyncio.run(main())
