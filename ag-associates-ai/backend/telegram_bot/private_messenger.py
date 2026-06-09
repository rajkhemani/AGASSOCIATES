"""Private Messenger — agent-initiated Telegram DMs.

Agents can send proactive updates to whitelisted users without waiting
for a user command. Whitelist is stored in Redis for quick lookup.
"""

import json
import logging
import os
from typing import Optional

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", "")
DM_WHITELIST_KEY = "agent:dm_whitelist"


def _redis_url() -> str:
    url = REDIS_URL
    if REDIS_PASSWORD and "redis://" in url:
        url = url.replace("redis://", f"redis://:{REDIS_PASSWORD}@")
    return url


async def get_redis() -> aioredis.Redis:
    return aioredis.from_url(_redis_url(), decode_responses=True)


async def send_dm(chat_id: int, text: str, parse_mode: str = "HTML") -> bool:
    """Send a Telegram DM to a whitelisted user."""
    if not TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not set, cannot send DM")
        return False

    import httpx
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage",
                json={
                    "chat_id": chat_id,
                    "text": text,
                    "parse_mode": parse_mode,
                    "disable_notification": False,
                },
            )
            if resp.status_code == 200:
                return True
            logger.error("DM send failed: %s", resp.text[:200])
            return False
    except Exception as e:
        logger.error("DM send error: %s", e)
        return False


async def add_to_whitelist(chat_id: int, label: str = "") -> bool:
    r = await get_redis()
    await r.hset(DM_WHITELIST_KEY, str(chat_id), label or "staff")
    return True


async def remove_from_whitelist(chat_id: int) -> bool:
    r = await get_redis()
    await r.hdel(DM_WHITELIST_KEY, str(chat_id))
    return True


async def is_whitelisted(chat_id: int) -> bool:
    r = await get_redis()
    return await r.hexists(DM_WHITELIST_KEY, str(chat_id))


async def get_whitelist() -> dict[str, str]:
    r = await get_redis()
    return await r.hgetall(DM_WHITELIST_KEY)


async def broadcast_to_role(chat_ids: list[int], text: str) -> int:
    sent = 0
    for cid in chat_ids:
        if await send_dm(cid, text):
            sent += 1
    return sent
