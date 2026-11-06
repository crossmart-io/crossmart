import { createHash } from 'node:crypto';

const SHA256 = 'sha256';
const BASE64URL = 'base64url';

/**
 * The S256 code challenge of a PKCE verifier (RFC 7636 §4.2): the base64url SHA-256 of the
 * verifier, without padding. The authorize URL carries the challenge; the code exchange
 * carries the verifier, which proves the same client started the flow.
 */
export function pkceS256Challenge(codeVerifier: string): string {
  return createHash(SHA256).update(codeVerifier).digest(BASE64URL);
}
