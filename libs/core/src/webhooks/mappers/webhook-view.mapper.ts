import { findEnumValue } from '@crossmart/common';
import type { WebhookEndpoint } from '@crossmart/database';
import type {
  WebhookEndpointLastDelivery,
  WebhookEndpointView,
} from '../entities/webhook-endpoint-view.js';
import type {
  WebhookDeliveryDetail,
  WebhookDeliveryView,
} from '../entities/webhook-delivery-view.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import type { DeliveryDetailRow, DeliveryRow } from '../repositories/webhook-delivery.queries.js';
import { toWebhookEnvelope } from '../rules/webhook-envelope.js';

/** Event types as stored; a type a newer version wrote and this one does not know is left out. */
function knownEventTypes(stored: readonly string[]): WebhookEventType[] {
  return stored.flatMap((value) => {
    const type = findEnumValue(WebhookEventType, value);
    return type ? [type] : [];
  });
}

/** The endpoint's latest attempt, or null before its first one. */
function lastDeliveryOf(endpoint: WebhookEndpoint): WebhookEndpointLastDelivery | null {
  const { lastAttemptAt, lastAttemptOutcome } = endpoint;
  if (lastAttemptAt === null || lastAttemptOutcome === null) return null;
  return {
    attemptedAt: lastAttemptAt,
    outcome: lastAttemptOutcome,
    responseStatus: endpoint.lastResponseStatus,
    error: endpoint.lastAttemptError,
  };
}

/** The endpoint as the API shows it, without any secret. */
export function toWebhookEndpointView(endpoint: WebhookEndpoint): WebhookEndpointView {
  return {
    id: endpoint.id,
    url: endpoint.url,
    description: endpoint.description,
    eventTypes: knownEventTypes(endpoint.eventTypes),
    enabled: endpoint.disabledReason === null,
    disabledReason: endpoint.disabledReason,
    disabledAt: endpoint.disabledAt,
    consecutiveFailures: endpoint.consecutiveFailures,
    lastDelivery: lastDeliveryOf(endpoint),
    previousSecretExpiresAt: endpoint.previousSecretExpiresAt,
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
  };
}

export function toWebhookDeliveryView(row: DeliveryRow): WebhookDeliveryView {
  return {
    id: row.id,
    endpointId: row.endpointId,
    eventId: row.eventId,
    eventType: row.event.type,
    status: row.status,
    attempts: row.attempts,
    responseStatus: row.responseStatus,
    durationMs: row.durationMs,
    error: row.error,
    nextAttemptAt: row.nextAttemptAt,
    lastAttemptAt: row.lastAttemptAt,
    deliveredAt: row.deliveredAt,
    createdAt: row.createdAt,
  };
}

export function toWebhookDeliveryDetail(row: DeliveryDetailRow): WebhookDeliveryDetail {
  return { ...toWebhookDeliveryView(row), payload: toWebhookEnvelope(row.event) };
}
