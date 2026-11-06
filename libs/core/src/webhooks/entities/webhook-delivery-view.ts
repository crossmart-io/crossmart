import type { SortDirection } from '@crossmart/common';
import type { WebhookDeliveryStatus } from '@crossmart/database';
import type { WebhookEnvelope } from './webhook-envelope.js';
import type { WebhookEventType } from '../enums/webhook-event-type.enum.js';

export interface WebhookDeliveryView {
  id: string;
  endpointId: string;
  eventId: string;
  /** A `WebhookEventType` value, as text: see `WebhookEnvelope.type`. */
  eventType: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  /** The HTTP status of the latest attempt; null when no answer came. */
  responseStatus: number | null;
  durationMs: number | null;
  /** Why the latest attempt failed, in safe words. */
  error: string | null;
  nextAttemptAt: Date | null;
  lastAttemptAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

/** One delivery with the body it sends. */
export interface WebhookDeliveryDetail extends WebhookDeliveryView {
  payload: WebhookEnvelope;
}

export interface WebhookDeliveryPage {
  items: WebhookDeliveryView[];
  nextCursor: string | null;
  total: number;
}

/** Newest first unless `direction` says otherwise. */
export interface WebhookDeliveryQuery {
  status?: WebhookDeliveryStatus;
  eventType?: WebhookEventType;
  direction?: SortDirection;
  cursor?: string;
  page?: number;
  limit: number;
}
