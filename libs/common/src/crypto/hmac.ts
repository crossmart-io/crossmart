import { createHmac, timingSafeEqual } from 'node:crypto';

const HMAC_ALGORITHM = 'sha256';

export type HmacEncoding = 'hex' | 'base64' | 'base64url';

/** An HMAC-SHA256 digest of `message`. */
export function hmacSha256(
  key: string | Buffer,
  message: string | Buffer,
  encoding: HmacEncoding,
): string {
  return createHmac(HMAC_ALGORITHM, key).update(message).digest(encoding);
}

/**
 * Compares two strings in constant time, so a signature check leaks nothing about how many
 * characters matched. Strings of different lengths are simply unequal.
 */
export function constantTimeEquals(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}
