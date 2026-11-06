import {
  WebhookDeliveryStatus,
  type WebhookEndpoint,
  type WebhookEvent,
} from '@crossmart/database';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import type {
  DeliveryDetailRow,
  DeliveryRow,
  DeliveryToSend,
} from '../repositories/webhook-delivery.queries.js';
import { WEBHOOK_API_VERSION } from '../webhooks.constants.js';

export const TEST_WORKSPACE_ID = '00000000-0000-4000-8000-000000000001';
export const TEST_ENDPOINT_ID = '00000000-0000-4000-8000-0000000000e1';
export const TEST_EVENT_ID = '00000000-0000-4000-8000-0000000000a1';
export const TEST_DELIVERY_ID = '00000000-0000-4000-8000-0000000000d1';
export const TEST_ENDPOINT_URL = 'https://hooks.example.com/crossmart';
export const TEST_CREATED_AT = new Date('2026-11-01T12:00:00Z');

/** An enabled endpoint as stored, subscribed to new orders. */
export function storedEndpoint(overrides: Partial<WebhookEndpoint> = {}): WebhookEndpoint {
  return {
    id: TEST_ENDPOINT_ID,
    workspaceId: TEST_WORKSPACE_ID,
    url: TEST_ENDPOINT_URL,
    description: null,
    eventTypes: [WebhookEventType.OrderCreated],
    sealedSecret: 'sealed-secret',
    previousSealedSecret: null,
    previousSecretExpiresAt: null,
    disabledReason: null,
    disabledAt: null,
    consecutiveFailures: 0,
    createdAt: TEST_CREATED_AT,
    updatedAt: TEST_CREATED_AT,
    ...overrides,
  };
}

/** A stored `order.created` event. */
export function storedEvent(overrides: Partial<WebhookEvent> = {}): WebhookEvent {
  return {
    id: TEST_EVENT_ID,
    workspaceId: TEST_WORKSPACE_ID,
    type: WebhookEventType.OrderCreated,
    apiVersion: WEBHOOK_API_VERSION,
    data: { order: { id: 'order-1' } },
    createdAt: TEST_CREATED_AT,
    ...overrides,
  };
}

type DeliveryColumns = Omit<DeliveryDetailRow, 'event'>;

function deliveryColumns(overrides: Partial<DeliveryColumns> = {}): DeliveryColumns {
  return {
    id: TEST_DELIVERY_ID,
    workspaceId: TEST_WORKSPACE_ID,
    eventId: TEST_EVENT_ID,
    endpointId: TEST_ENDPOINT_ID,
    status: WebhookDeliveryStatus.PENDING,
    attempts: 0,
    nextAttemptAt: TEST_CREATED_AT,
    leaseExpiresAt: null,
    lastAttemptAt: null,
    deliveredAt: null,
    responseStatus: null,
    durationMs: null,
    error: null,
    createdAt: TEST_CREATED_AT,
    updatedAt: TEST_CREATED_AT,
    ...overrides,
  };
}

/** A delivery as the log lists it. */
export function deliveryRow(overrides: Partial<DeliveryColumns> = {}): DeliveryRow {
  return { ...deliveryColumns(overrides), event: { type: WebhookEventType.OrderCreated } };
}

/** A delivery with its whole event. */
export function deliveryDetailRow(
  overrides: Partial<DeliveryColumns> = {},
  event: WebhookEvent = storedEvent(),
): DeliveryDetailRow {
  return { ...deliveryColumns(overrides), event };
}

/** A claimed delivery with what sending it needs. */
export function deliveryToSend(
  event: WebhookEvent = storedEvent(),
  endpoint: Partial<WebhookEndpoint> = {},
): DeliveryToSend {
  const stored = storedEndpoint(endpoint);
  return {
    ...deliveryColumns({ endpointId: stored.id }),
    event,
    endpoint: {
      id: stored.id,
      workspaceId: stored.workspaceId,
      url: stored.url,
      sealedSecret: stored.sealedSecret,
      previousSealedSecret: stored.previousSealedSecret,
      previousSecretExpiresAt: stored.previousSecretExpiresAt,
      disabledReason: stored.disabledReason,
    },
  };
}
