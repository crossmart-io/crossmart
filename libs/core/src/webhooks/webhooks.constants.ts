/**
 * Outgoing webhooks (ADR 0023). Every number that shapes delivery lives here, so the ADR, the
 * docs and the code read the same values.
 */

/** The payload format version every event carries as `apiVersion`. */
export const WEBHOOK_API_VERSION = 'v1';

// ─── Signing ─────────────────────────────────────────────────────────────────

/** Signing secrets start with this, so a leaked one is easy to recognise and scan for. */
export const WEBHOOK_SECRET_PREFIX = 'whsec_';
/** Random bytes in a signing secret (256 bits). */
export const WEBHOOK_SECRET_BYTES = 32;
/** After a rotation, deliveries are also signed with the old secret for this long. */
export const WEBHOOK_SECRET_ROTATION_GRACE_MS = 24 * 60 * 60 * 1000;
/** The context a sealed secret is bound to, with the endpoint id. */
export const WEBHOOK_SECRET_CONTEXT_PREFIX = 'webhook-endpoint:';
/** The signature scheme: HMAC-SHA256 over `<timestamp>.<body>`, hex encoded. */
export const WEBHOOK_SIGNATURE_SCHEME = 'v1';
export const WEBHOOK_TIMESTAMP_KEY = 't';
export const WEBHOOK_SIGNATURE_PAIR_SEPARATOR = ',';
export const WEBHOOK_SIGNATURE_KEY_SEPARATOR = '=';
export const WEBHOOK_SIGNED_PAYLOAD_SEPARATOR = '.';
/** How far a receiver should let a signature's timestamp drift; the SDKs use the same default. */
export const WEBHOOK_SIGNATURE_TOLERANCE_SECONDS = 300;
export const MS_PER_SECOND = 1000;

// ─── Request ─────────────────────────────────────────────────────────────────

export enum WebhookHeader {
  Signature = 'Crossmart-Signature',
  EventId = 'Crossmart-Event-Id',
  EventType = 'Crossmart-Event-Type',
  DeliveryId = 'Crossmart-Delivery-Id',
  ContentType = 'Content-Type',
  UserAgent = 'User-Agent',
}

export const WEBHOOK_CONTENT_TYPE = 'application/json';
export const WEBHOOK_USER_AGENT = 'Crossmart-Webhooks/1.0 (+https://crossmart.io)';
/** An endpoint must answer within this, or the attempt fails as a timeout. */
export const WEBHOOK_REQUEST_TIMEOUT_MS = 10_000;
/** At most this much of a response is read; the rest is dropped and the body is never stored. */
export const WEBHOOK_RESPONSE_MAX_BYTES = 64 * 1024;

// ─── Endpoint URLs ───────────────────────────────────────────────────────────

export const WEBHOOK_URL_MAX_LENGTH = 2048;
export const WEBHOOK_DESCRIPTION_MAX_LENGTH = 500;

// ─── Retries ─────────────────────────────────────────────────────────────────

/** Attempts per delivery, the first included. With the delays below, about 16 hours in all. */
export const WEBHOOK_MAX_ATTEMPTS = 12;
/** Test events are tried once: the person who sent one is watching the result. */
export const WEBHOOK_TEST_MAX_ATTEMPTS = 1;
/** The delay before the first retry; each later one doubles, up to the maximum. */
export const WEBHOOK_RETRY_BASE_DELAY_MS = 30_000;
export const WEBHOOK_RETRY_MAX_DELAY_MS = 6 * 60 * 60 * 1000;
export const WEBHOOK_RETRY_BACKOFF_FACTOR = 2;
/** Up to this share of a delay is added at random, so retries of many events spread out. */
export const WEBHOOK_RETRY_JITTER_RATIO = 0.1;
/** Failed attempts in a row, across events, after which an endpoint is disabled. */
export const WEBHOOK_DISABLE_AFTER_CONSECUTIVE_FAILURES = 30;

// ─── Dispatch ────────────────────────────────────────────────────────────────

/** How often due deliveries are looked for; one schedule however many workers run. */
export const WEBHOOK_DISPATCH_INTERVAL_MS = 2_000;
/** Deliveries claimed and queued at once. */
export const WEBHOOK_DISPATCH_BATCH_SIZE = 100;
/** Batches one dispatch run claims at most, so a backlog never keeps one job running for long. */
export const WEBHOOK_DISPATCH_MAX_BATCHES = 10;
/**
 * A claimed delivery is held this long. A worker that dies mid-delivery loses it when the lease
 * expires, and the delivery is tried again: at-least-once.
 */
export const WEBHOOK_DELIVERY_LEASE_MS = 2 * 60 * 1000;
export const WEBHOOK_DISPATCH_SCHEDULER_ID = 'webhook-dispatch';
export const WEBHOOK_RETENTION_SCHEDULER_ID = 'webhook-retention';

// ─── Retention ───────────────────────────────────────────────────────────────

/** Events and their deliveries are kept this long, then deleted. */
export const WEBHOOK_RETENTION_DAYS = 30;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const WEBHOOK_RETENTION_INTERVAL_MS = MS_PER_DAY;
/** Events deleted per statement, so retention never holds long locks. */
export const WEBHOOK_RETENTION_BATCH_SIZE = 1000;

// ─── Messages ────────────────────────────────────────────────────────────────

export const WEBHOOK_ENDPOINT_NOT_FOUND = 'Webhook endpoint not found';
export const WEBHOOK_DELIVERY_NOT_FOUND = 'Webhook delivery not found';
export const WEBHOOKS_NOT_CONFIGURED =
  'Webhooks need CREDENTIALS_MASTER_KEY to be set, to encrypt signing secrets';
export const WEBHOOK_TEST_MESSAGE = 'This is a test event from Crossmart.';
/** The reason recorded on deliveries cancelled because their endpoint was disabled. */
export const WEBHOOK_ENDPOINT_DISABLED_ERROR = 'The endpoint was disabled';

// ─── Queue ───────────────────────────────────────────────────────────────────

/** Joins a delivery id and its attempt count into the job's deduplication id. */
export const WEBHOOK_JOB_KEY_SEPARATOR = ':';
/** One dispatch waits at a time however many are asked for; a later run picks up the rest. */
export const WEBHOOK_DISPATCH_DEDUPLICATION_ID = 'webhook-dispatch';
export const WEBHOOK_JOBS_KEPT_COMPLETED = 100;
export const WEBHOOK_JOBS_KEPT_FAILED = 1000;

/** The web app's webhook settings, linked from the email sent when an endpoint is turned off. */
export const WEBHOOK_SETTINGS_PATH = '/settings/webhooks';
