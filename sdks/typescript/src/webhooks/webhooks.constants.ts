/**
 * Headers of a webhook delivery, lowercased as Node.js exposes them in `request.headers`.
 * `Headers.get()` and Express's `req.get()` match them case-insensitively.
 */
export const WEBHOOK_SIGNATURE_HEADER = 'crossmart-signature';
export const WEBHOOK_EVENT_ID_HEADER = 'crossmart-event-id';
export const WEBHOOK_EVENT_TYPE_HEADER = 'crossmart-event-type';
export const WEBHOOK_DELIVERY_ID_HEADER = 'crossmart-delivery-id';

/** How far the signature's timestamp may be from the current time, either way. */
export const DEFAULT_WEBHOOK_TOLERANCE_SECONDS = 300;

/** Every event type Crossmart sends today. New types may be added without a major version. */
export const WEBHOOK_EVENT_TYPES = [
  'order.created',
  'order.updated',
  'inventory.stock_changed',
  'listing.published',
  'listing.failed',
  'listing.removed',
  'product.created',
  'product.updated',
  'product.deleted',
  'webhook.test',
] as const;

/** `Crossmart-Signature: t=<unix seconds>,v1=<hex>[,v1=<hex>...]` */
export const SIGNATURE_ELEMENT_SEPARATOR = ',';
export const SIGNATURE_KEY_VALUE_SEPARATOR = '=';
export const TIMESTAMP_KEY = 't';
export const SIGNATURE_SCHEME_V1 = 'v1';
/** The signed content is `<timestamp>.<raw body>`. */
export const SIGNED_PAYLOAD_SEPARATOR = '.';

export const HMAC_ALGORITHM = 'HMAC';
export const HMAC_HASH = 'SHA-256';
export const HMAC_SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;
export const UNIX_TIMESTAMP_PATTERN = /^\d+$/;
export const HEX_RADIX = 16;
export const HEX_CHARS_PER_BYTE = 2;
export const MS_PER_SECOND = 1_000;
