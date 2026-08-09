"""Tests for the staff-reply → case OTP handover.

The behaviour worth pinning is narrow: a code reaches the case that is waiting
for it, and nothing else is disturbed. Both failure directions are costly — a
missed capture leaves an RPA run timing out with a human sitting there having
answered, and a wrong capture submits someone else's number to a government
portal, which invalidates the real OTP and gives no clue why.
"""

import asyncio

import pytest

from telegram_bot.otp_bridge import (
    OTP_TTL_SECONDS,
    capture_otp,
    extract_otp,
    otp_key,
    waiting_key,
)


class FakeRedis:
    """Just enough Redis to exercise the handover, with the real key names."""

    def __init__(self, **initial):
        self.store = dict(initial)
        self.setex_calls = []

    async def get(self, key):
        value = self.store.get(key)
        return value.encode() if isinstance(value, str) else value

    async def setex(self, key, ttl, value):
        self.setex_calls.append((key, ttl, value))
        self.store[key] = value


# --------------------------------------------------------------------------
# Recognising a code
# --------------------------------------------------------------------------


@pytest.mark.parametrize("text", ["482913", "4829", "48291357", "otp is 482913"])
def test_a_message_carrying_one_code_yields_it(text):
    assert extract_otp(text) == text.split()[-1]


@pytest.mark.parametrize("text", ["", None, "no digits here", "12", "123456789"])
def test_a_message_with_no_usable_code_yields_nothing(text):
    """Four to eight digits, matching what the SMS path already accepts."""
    assert extract_otp(text) is None


def test_a_message_with_two_numbers_is_refused_rather_than_guessed():
    """Submitting the wrong one burns the real OTP at the portal."""
    assert extract_otp("case 4471, otp 90210") is None


# --------------------------------------------------------------------------
# The handover
# --------------------------------------------------------------------------


def test_a_reply_reaches_the_case_that_is_waiting():
    r = FakeRedis(**{waiting_key(555): "AG-1"})

    assert asyncio.run(capture_otp(r, 555, "482913")) == "AG-1"
    assert r.setex_calls == [(otp_key("AG-1"), OTP_TTL_SECONDS, "482913")]


def test_nothing_is_captured_when_no_case_is_waiting():
    """Ordinary chat containing a number must stay ordinary chat."""
    r = FakeRedis()

    assert asyncio.run(capture_otp(r, 555, "the fee was 4500")) is None
    assert r.setex_calls == []


def test_a_waiting_case_does_not_swallow_an_ordinary_message():
    """Waiting on an OTP does not turn every message into one."""
    r = FakeRedis(**{waiting_key(555): "AG-1"})

    assert asyncio.run(capture_otp(r, 555, "on my way to the registrar")) is None
    assert r.setex_calls == []


def test_a_reply_from_a_different_chat_is_not_taken_for_the_case():
    """The park is per chat, so another chat's numbers must not satisfy it."""
    r = FakeRedis(**{waiting_key(555): "AG-1"})

    assert asyncio.run(capture_otp(r, 999, "482913")) is None
    assert r.setex_calls == []


def test_the_stored_code_expires():
    """The executor deletes it on read; the TTL covers the case where it gave
    up first, so a stale code cannot be used against a later case."""
    r = FakeRedis(**{waiting_key(555): "AG-1"})

    asyncio.run(capture_otp(r, 555, "482913"))
    _, ttl, _ = r.setex_calls[0]
    assert ttl == OTP_TTL_SECONDS


def test_a_bytes_case_id_from_redis_is_handled():
    """redis-py returns bytes unless decode_responses is set; the executor does
    not set it, so the bridge must not assume str."""
    r = FakeRedis()
    r.store[waiting_key(555)] = b"AG-2"

    assert asyncio.run(capture_otp(r, 555, "482913")) == "AG-2"
    assert r.setex_calls == [(otp_key("AG-2"), OTP_TTL_SECONDS, "482913")]
