import { parseSignatureHeader } from './signature-header.js';
import type { VerifyWebhookSignatureOptions, WebhookEvent } from './webhook-event.js';
import { WebhookSignatureError, WebhookSignatureFailure } from './webhook-signature-error.js';
import {
  DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  HEX_CHARS_PER_BYTE,
  HEX_RADIX,
  HMAC_ALGORITHM,
  HMAC_HASH,
  HMAC_SHA256_HEX_PATTERN,
  MS_PER_SECOND,
  SIGNED_PAYLOAD_SEPARATOR,
} from './webhooks.constants.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Verifies that a webhook delivery comes from Crossmart and returns its parsed event.
 *
 * Pass the raw request body, exactly as received: verifying a re-serialized object fails.
 * Uses the Web Crypto API, so it runs in Node.js 20+, Deno, Bun, browsers and edge runtimes.
 *
 * @throws {WebhookSignatureError} when the header is missing or malformed, the timestamp is
 * outside the tolerance, or no signature matches.
 *
 * @example
 * ```ts
 * const event = await verifyWebhookSignature({
 *   payload: req.body, // a Buffer from express.raw()
 *   header: req.get('Crossmart-Signature'),
 *   secret: process.env.CROSSMART_WEBHOOK_SECRET,
 * });
 * ```
 */
export async function verifyWebhookSignature(
  options: VerifyWebhookSignatureOptions,
): Promise<WebhookEvent> {
  const { timestamp, signatures } = parseSignatureHeader(options.header);
  assertWithinTolerance(
    Number(timestamp),
    options.now ?? new Date(),
    options.toleranceSeconds ?? DEFAULT_WEBHOOK_TOLERANCE_SECONDS,
  );
  const payload = toBytes(options.payload);
  const signedContent = concatBytes(encoder.encode(timestamp + SIGNED_PAYLOAD_SEPARATOR), payload);
  if (!(await matchesAnySignature(options.secret, signedContent, signatures))) {
    throw new WebhookSignatureError(WebhookSignatureFailure.SignatureMismatch);
  }
  return parseEvent(payload);
}

function assertWithinTolerance(
  timestampSeconds: number,
  now: Date,
  toleranceSeconds: number,
): void {
  const nowSeconds = Math.floor(now.getTime() / MS_PER_SECOND);
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) {
    throw new WebhookSignatureError(WebhookSignatureFailure.TimestampOutsideTolerance);
  }
}

/** `crypto.subtle.verify` compares in constant time, so the signatures never leak by timing. */
async function matchesAnySignature(
  secret: string,
  signedContent: Uint8Array<ArrayBuffer>,
  signatures: readonly string[],
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: HMAC_ALGORITHM, hash: HMAC_HASH },
    false,
    ['verify'],
  );
  for (const signature of signatures) {
    const expected = hexToBytes(signature);
    if (expected && (await crypto.subtle.verify(HMAC_ALGORITHM, key, expected, signedContent))) {
      return true;
    }
  }
  return false;
}

function parseEvent(payload: Uint8Array): WebhookEvent {
  let event: unknown;
  try {
    event = JSON.parse(decoder.decode(payload));
  } catch (error) {
    throw new WebhookSignatureError(WebhookSignatureFailure.InvalidPayload, { cause: error });
  }
  if (typeof event !== 'object' || event === null || Array.isArray(event)) {
    throw new WebhookSignatureError(WebhookSignatureFailure.InvalidPayload);
  }
  return event as WebhookEvent;
}

function toBytes(payload: string | Uint8Array): Uint8Array {
  return typeof payload === 'string' ? encoder.encode(payload) : payload;
}

function concatBytes(prefix: Uint8Array, payload: Uint8Array): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(prefix.length + payload.length);
  bytes.set(prefix);
  bytes.set(payload, prefix.length);
  return bytes;
}

/** Decodes a SHA-256 hex digest, or returns `undefined` for anything else (never a match). */
function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | undefined {
  if (!HMAC_SHA256_HEX_PATTERN.test(hex)) {
    return undefined;
  }
  const bytes = new Uint8Array(hex.length / HEX_CHARS_PER_BYTE);
  for (let index = 0; index < bytes.length; index++) {
    const offset = index * HEX_CHARS_PER_BYTE;
    bytes[index] = Number.parseInt(hex.slice(offset, offset + HEX_CHARS_PER_BYTE), HEX_RADIX);
  }
  return bytes;
}
