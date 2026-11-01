import { createHash, randomBytes } from 'node:crypto';

const HASH_ALGORITHM = 'sha256';
const HASH_ENCODING = 'hex';
const TOKEN_ENCODING = 'base64url';

/** A URL-safe random token with `byteLength` bytes of entropy. */
export function generateSecureToken(byteLength: number): string {
  return randomBytes(byteLength).toString(TOKEN_ENCODING);
}

/** A one-way SHA-256 digest, for storing secrets that only need to be compared. */
export function hashSecret(secret: string): string {
  return createHash(HASH_ALGORITHM).update(secret).digest(HASH_ENCODING);
}
