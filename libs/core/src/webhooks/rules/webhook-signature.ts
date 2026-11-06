import { hmacSha256 } from '@crossmart/common';
import {
  MS_PER_SECOND,
  WEBHOOK_SIGNATURE_KEY_SEPARATOR,
  WEBHOOK_SIGNATURE_PAIR_SEPARATOR,
  WEBHOOK_SIGNATURE_SCHEME,
  WEBHOOK_SIGNED_PAYLOAD_SEPARATOR,
  WEBHOOK_TIMESTAMP_KEY,
} from '../webhooks.constants.js';

const SIGNATURE_ENCODING = 'hex';

/** Seconds since the epoch, as the signature's timestamp carries them. */
export function toUnixSeconds(at: Date): number {
  return Math.floor(at.getTime() / MS_PER_SECOND);
}

/** HMAC-SHA256 of `<timestamp>.<body>`, keyed with the whole secret, in lowercase hex. */
export function signWebhookPayload(secret: string, timestamp: number, body: string): string {
  const signedPayload = `${timestamp}${WEBHOOK_SIGNED_PAYLOAD_SEPARATOR}${body}`;
  return hmacSha256(secret, signedPayload, SIGNATURE_ENCODING);
}

function pair(key: string, value: string | number): string {
  return `${key}${WEBHOOK_SIGNATURE_KEY_SEPARATOR}${value}`;
}

/**
 * The `Crossmart-Signature` header: `t=<timestamp>,v1=<signature>`, with one `v1` per secret.
 * During a rotation both the new and the old secret sign, so receivers can switch at their pace.
 */
export function webhookSignatureHeader(
  secrets: readonly string[],
  timestamp: number,
  body: string,
): string {
  const signatures = secrets.map((secret) =>
    pair(WEBHOOK_SIGNATURE_SCHEME, signWebhookPayload(secret, timestamp, body)),
  );
  return [pair(WEBHOOK_TIMESTAMP_KEY, timestamp), ...signatures].join(
    WEBHOOK_SIGNATURE_PAIR_SEPARATOR,
  );
}
