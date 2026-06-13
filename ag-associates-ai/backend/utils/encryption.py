import os
import base64
import logging
from typing import Optional

logger = logging.getLogger(__name__)

PII_ENCRYPTION_KEY = os.getenv("PII_ENCRYPTION_KEY", "")


def _get_key_bytes() -> Optional[bytes]:
    key = PII_ENCRYPTION_KEY
    if not key:
        return None
    try:
        return base64.b64decode(key)
    except Exception:
        logger.error("PII_ENCRYPTION_KEY is not valid base64")
        return None


def encrypt_plaintext(plaintext: str) -> Optional[str]:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    key = _get_key_bytes()
    if key is None or len(key) != 32:
        logger.warning("PII_ENCRYPTION_KEY not configured or invalid. Skipping encryption.")
        return None

    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_ciphertext(encoded: str) -> Optional[str]:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM

    key = _get_key_bytes()
    if key is None or len(key) != 32:
        logger.warning("PII_ENCRYPTION_KEY not configured or invalid. Skipping decryption.")
        return None

    try:
        raw = base64.b64decode(encoded)
        nonce, ciphertext = raw[:12], raw[12:]
        aesgcm = AESGCM(key)
        return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")
    except Exception as e:
        logger.error(f"Decryption failed: {e}")
        return None
