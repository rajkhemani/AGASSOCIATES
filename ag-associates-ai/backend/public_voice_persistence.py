"""Persistence boundary for consented public voice leads.

This module deliberately stores structured contact details only.  Audio and
transcripts remain transient at the public voice boundary.
"""

from __future__ import annotations

import hashlib
import os
import uuid
from datetime import datetime
from typing import Any

import psycopg2

from config import get_database_url


def _dedup_key(*, phone: str | None, email: str | None, intent: str) -> str:
    contact = f"{phone or ''}|{email or ''}|{intent}"
    return hashlib.sha256(contact.encode("utf-8")).hexdigest()


def persist_public_lead(
    *,
    name: str,
    organization: str | None,
    phone: str | None,
    email: str | None,
    preferred_time: str | None,
    intent: str,
    consented_at: datetime,
    source: str,
    session_id: str,
) -> dict[str, Any]:
    """Insert or deduplicate a public lead and notify internal admins.

    The organization is explicit so anonymous traffic cannot cross tenant
    boundaries.  It is configured per deployment via PUBLIC_VOICE_ORG_ID.
    """
    org_id = os.environ.get("PUBLIC_VOICE_ORG_ID", "").strip()
    if not org_id:
        raise RuntimeError("PUBLIC_VOICE_ORG_ID is not configured")

    lead_id = str(uuid.uuid4())
    dedup_key = _dedup_key(phone=phone, email=email, intent=intent)
    with psycopg2.connect(get_database_url()) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO public.public_voice_leads
                    (id, org_id, name, organization, phone, email, preferred_time,
                     intent, status, consented_at, source, session_id, dedup_key)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'new', %s, %s, %s, %s)
                ON CONFLICT (dedup_key) DO UPDATE
                    SET updated_at = now(), last_seen_at = now()
                RETURNING id, (xmax = 0) AS inserted
                """,
                (
                    lead_id,
                    org_id,
                    name,
                    organization,
                    phone,
                    email,
                    preferred_time,
                    intent,
                    consented_at,
                    source,
                    session_id,
                    dedup_key,
                ),
            )
            row = cur.fetchone()
            persisted_id, inserted = str(row[0]), bool(row[1])

            if inserted:
                cur.execute(
                    """
                    INSERT INTO public.notifications (user_id, type, message, link)
                    SELECT user_id, 'public_voice_lead',
                           'A new consented public voice lead is ready for review.',
                           '/leads/' || %s
                      FROM public.user_roles
                     WHERE role IN ('admin', 'staff')
                       AND org_id = %s
                    """,
                    (persisted_id, org_id),
                )

    try:
        from workforce.ledger import record_activity

        record_activity(
            source="public_voice",
            staff_kind=None,
            staff_short_name=None,
            capability_code="lead.capture",
            summary="Public voice lead received",
            payload={"lead_id": persisted_id, "intent": intent, "deduplicated": not inserted},
            status="ok",
            org_id=org_id,
        )
    except Exception:
        # Audit follows the existing best-effort ledger pattern.
        pass

    return {"lead_id": persisted_id, "deduplicated": not inserted}
