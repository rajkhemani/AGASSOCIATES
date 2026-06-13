import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) return null;
  try {
    return Buffer.from(key, 'base64');
  } catch {
    console.error('PII_ENCRYPTION_KEY is not valid base64');
    return null;
  }
}

export function encryptPii(plaintext: string): string | null {
  const key = getKey();
  if (!key || key.length !== 32) {
    console.warn('PII_ENCRYPTION_KEY not configured or invalid. Skipping encryption.');
    return null;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf-8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptPii(encoded: string): string | null {
  const key = getKey();
  if (!key || key.length !== 32) {
    console.warn('PII_ENCRYPTION_KEY not configured or invalid. Skipping decryption.');
    return null;
  }

  try {
    const raw = Buffer.from(encoded, 'base64');
    const iv = raw.subarray(0, IV_LENGTH);
    const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = raw.subarray(IV_LENGTH + TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf-8');
  } catch (err) {
    console.error('Decryption failed:', err);
    return null;
  }
}
