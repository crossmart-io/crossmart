import {
  WebhookAttemptOutcome,
  WebhookDeliveryStatus,
  WebhookDisabledReason,
} from '@crossmart/database';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import {
  deliveryDetailRow,
  deliveryRow,
  storedEndpoint,
  storedEvent,
  TEST_CREATED_AT,
  TEST_EVENT_ID,
  TEST_WORKSPACE_ID,
} from '../testing/webhook-fixtures.js';
import {
  toWebhookDeliveryDetail,
  toWebhookDeliveryView,
  toWebhookEndpointView,
} from './webhook-view.mapper.js';

describe('toWebhookEndpointView', () => {
  it('shows an endpoint without a disabled reason as enabled, and no secret', () => {
    const view = toWebhookEndpointView(storedEndpoint({ previousSealedSecret: 'sealed-old' }));

    expect(view.enabled).toBe(true);
    expect(view.disabledReason).toBeNull();
    expect(JSON.stringify(view)).not.toContain('sealed');
  });

  it('shows an endpoint with a disabled reason as disabled', () => {
    const view = toWebhookEndpointView(
      storedEndpoint({ disabledReason: WebhookDisabledReason.MANUAL, disabledAt: TEST_CREATED_AT }),
    );

    expect(view).toMatchObject({
      enabled: false,
      disabledReason: WebhookDisabledReason.MANUAL,
      disabledAt: TEST_CREATED_AT,
    });
  });

  it('leaves out stored event types this version does not know', () => {
    const view = toWebhookEndpointView(
      storedEndpoint({ eventTypes: [WebhookEventType.OrderCreated, 'order.teleported'] }),
    );

    expect(view.eventTypes).toEqual([WebhookEventType.OrderCreated]);
  });

  it('has no last delivery before the first attempt', () => {
    expect(toWebhookEndpointView(storedEndpoint()).lastDelivery).toBeNull();
  });

  it('shows the latest attempt with its outcome', () => {
    const view = toWebhookEndpointView(
      storedEndpoint({
        consecutiveFailures: 3,
        lastAttemptAt: TEST_CREATED_AT,
        lastAttemptOutcome: WebhookAttemptOutcome.FAILED,
        lastResponseStatus: 503,
        lastAttemptError: 'The endpoint answered with HTTP 503',
      }),
    );

    expect(view.consecutiveFailures).toBe(3);
    expect(view.lastDelivery).toEqual({
      attemptedAt: TEST_CREATED_AT,
      outcome: WebhookAttemptOutcome.FAILED,
      responseStatus: 503,
      error: 'The endpoint answered with HTTP 503',
    });
  });
});

describe('toWebhookDeliveryView', () => {
  it('shows the delivery with its event type', () => {
    const view = toWebhookDeliveryView(
      deliveryRow({ status: WebhookDeliveryStatus.RETRYING, attempts: 2, responseStatus: 500 }),
    );

    expect(view).toMatchObject({
      eventId: TEST_EVENT_ID,
      eventType: WebhookEventType.OrderCreated,
      status: WebhookDeliveryStatus.RETRYING,
      attempts: 2,
      responseStatus: 500,
    });
    expect(view).not.toHaveProperty('leaseExpiresAt');
  });

  it('keeps an event type a newer version stored, rather than failing the log', () => {
    const row = deliveryRow();
    const view = toWebhookDeliveryView({ ...row, event: { type: 'order.teleported' } });

    expect(view.eventType).toBe('order.teleported');
  });
});

describe('toWebhookDeliveryDetail', () => {
  it('adds the envelope the endpoint receives', () => {
    const detail = toWebhookDeliveryDetail(deliveryDetailRow({}, storedEvent()));

    expect(detail.payload).toEqual({
      id: TEST_EVENT_ID,
      type: WebhookEventType.OrderCreated,
      createdAt: TEST_CREATED_AT.toISOString(),
      workspaceId: TEST_WORKSPACE_ID,
      apiVersion: 'v1',
      data: { order: { id: 'order-1' } },
    });
  });
});
