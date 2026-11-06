import type { WebhookEnvelope } from '../entities/webhook-envelope.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import { WEBHOOK_CONTENT_TYPE, WEBHOOK_USER_AGENT, WebhookHeader } from '../webhooks.constants.js';
import { buildWebhookRequest } from './webhook-request.js';
import { webhookSignatureHeader } from './webhook-signature.js';

const SENT_AT = new Date('2026-11-01T12:00:00.750Z');
const ENVELOPE: WebhookEnvelope = {
  id: 'evt-1',
  type: WebhookEventType.ProductUpdated,
  createdAt: '2026-11-01T11:59:00.000Z',
  workspaceId: 'ws-1',
  apiVersion: 'v1',
  data: { product: { id: 'product-1', title: 'Mug' } },
};

describe('buildWebhookRequest', () => {
  const request = buildWebhookRequest({
    url: 'https://hooks.example.com/in',
    deliveryId: 'delivery-1',
    envelope: ENVELOPE,
    secrets: ['whsec_new', 'whsec_old'],
    sentAt: SENT_AT,
  });

  it('sends the envelope as JSON to the endpoint URL', () => {
    expect(request.url).toBe('https://hooks.example.com/in');
    expect(JSON.parse(request.body)).toEqual(ENVELOPE);
  });

  it('names the event, its type and the delivery in headers', () => {
    expect(request.headers).toMatchObject({
      [WebhookHeader.ContentType]: WEBHOOK_CONTENT_TYPE,
      [WebhookHeader.UserAgent]: WEBHOOK_USER_AGENT,
      [WebhookHeader.EventId]: 'evt-1',
      [WebhookHeader.EventType]: WebhookEventType.ProductUpdated,
      [WebhookHeader.DeliveryId]: 'delivery-1',
    });
  });

  it('signs the body with every secret at the second it is sent', () => {
    expect(request.headers[WebhookHeader.Signature]).toBe(
      webhookSignatureHeader(['whsec_new', 'whsec_old'], 1_793_534_400, request.body),
    );
  });
});
