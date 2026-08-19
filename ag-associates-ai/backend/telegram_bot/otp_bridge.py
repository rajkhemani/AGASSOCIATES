"""The missing half of the OTP handover between staff and the RPA executor.

``executor_agent.wait_for_otp`` parks a case against a chat — ``otp_waiting:
{chat_id}`` — announces on Telegram that an OTP is needed, then polls
``otp:{case_id}`` until the code appears or it gives up. Its own comment says
"so Telegram webhook can map reply → case".

Nothing ever wrote ``otp:{case_id}``, and nothing ever read ``otp_waiting:``.
The bot spoke a different protocol entirely: keyed by *portal*, fed from an SMS
forwarder on ``sms:incoming``, delivering codes outward to staff. The two halves
shared a Redis instance and not one key, so the executor's wait could only ever
time out — the staff reply landed in the chat handler, which ignores anything
outside Aisha mode, and was dropped.

This module is the join. It is deliberately separate from ``bot.py`` and free of
``python-telegram-bot`` so the decision — *is this message an OTP, and for which
case?* — can be tested without a bot, a network or a Telegram token. The handler
in ``bot.py`` is then thin enough to read at a glance.
"""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING

if TYPE_CHECKING:  # pragma: no cover - annotations only
    from redis.asyncio import Redis

logger = logging.getLogger(__name__)

__all__ = ["OTP_PATTERN", "capture_otp", "extract_otp", "otp_key", "waiting_key"]

#: Same pattern the SMS path already uses (bot.py, incoming-SMS detection).
#: Shared rather than restated: two definitions of "looks like an OTP" would
#: drift, and the one that drifted would silently stop matching real codes.
OTP_PATTERN = re.compile(r"\b(\d{4,8})\b")

#: How long a captured code stays available. The executor deletes it as soon as
#: it reads it, so this only matters when the executor has already given up —
#: in which case the code is stale and must not sit around waiting to be used
#: against some later case.
OTP_TTL_SECONDS = 300


def waiting_key(chat_id: int | str) -> str:
    """Redis key under which the executor parks the case awaiting an OTP."""
    return f"otp_waiting:{chat_id}"


def otp_key(case_id: str) -> str:
    """Redis key the executor polls for the code."""
    return f"otp:{case_id}"


def extract_otp(text: str | None) -> str | None:
    """Return the OTP in ``text``, or None if there isn't exactly one.

    Ambiguity is refused rather than guessed at. A message carrying two
    numbers — "case 4471, otp 90210" — could be either, and submitting the
    wrong one to a government portal burns the real OTP: the portal invalidates
    it, and the staff member has to request another without knowing why the
    first failed.
    """
    if not text:
        return None
    found = OTP_PATTERN.findall(text)
    if len(found) != 1:
        return None
    return found[0]


async def capture_otp(r: Redis, chat_id: int | str, text: str | None) -> str | None:
    """Route a staff reply to the case waiting on it.

    Returns the case id when the code was stored, otherwise None — None meaning
    "this was an ordinary message", so the caller should let normal handling
    proceed. Nothing is consumed unless a case is actually waiting, so ordinary
    chat that happens to contain a number is untouched.
    """
    waiting = await r.get(waiting_key(chat_id))
    if not waiting:
        return None

    code = extract_otp(text)
    if code is None:
        return None

    case_id = waiting.decode() if isinstance(waiting, bytes) else str(waiting)
    await r.setex(otp_key(case_id), OTP_TTL_SECONDS, code)
    # The code itself is never logged — it is a live credential for a
    # government portal, and these logs ship to the container log.
    logger.info("OTP captured from chat %s for case %s", chat_id, case_id)
    return case_id
