import type { WEBHOOK_EVENT_TYPES } from './webhooks.constants.js';

/** An event type Crossmart sends today, such as `'order.created'`. */
export type KnownWebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

/**
 * The envelope of every webhook delivery. `type` is typed as the known event types, but stays
 * open to new ones, so handlers should ignore types they do not recognise.
 */
export interface WebhookEvent {
  /** The event's id. Retries of one delivery carry the same id, so use it to deduplicate. */
  id: string;
  type: KnownWebhookEventType | (string & Record<never, never>);
  /** When the event happened, as an ISO 8601 string. */
  createdAt: string;
  workspaceId: string;
  /** The API version the `data` payload follows, such as `'v1'`. */
  apiVersion: string;
  /** The event's payload. Its shape depends on `type`. */
  data: Record<string, unknown>;
}

export interface VerifyWebhookSignatureOptions {
  /** The raw request body, exactly as received. Never a re-serialized object. */
  payload: string | Uint8Array;
  /** The value of the `Crossmart-Signature` header. */
  header: string | null | undefined;
  /** The endpoint's signing secret, including its `whsec_` prefix. */
  secret: string;
  /** How far the signature's timestamp may be from `now`, in seconds. Defaults to 300. */
  toleranceSeconds?: number;
  /** The current time. Defaults to the system clock; pass one in tests. */
  now?: Date;
}
