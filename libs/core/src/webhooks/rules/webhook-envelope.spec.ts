import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import { toWebhookEnvelope } from './webhook-envelope.js';

describe('toWebhookEnvelope', () => {
  it('carries the event id, type, time, workspace, version and data', () => {
    const createdAt = new Date('2026-11-06T10:00:00.000Z');
    expect(
      toWebhookEnvelope({
        id: 'event-1',
        workspaceId: 'workspace-1',
        type: WebhookEventType.ProductCreated,
        apiVersion: 'v1',
        data: { product: { id: 'p-1' } },
        createdAt,
      }),
    ).toEqual({
      id: 'event-1',
      type: WebhookEventType.ProductCreated,
      createdAt: '2026-11-06T10:00:00.000Z',
      workspaceId: 'workspace-1',
      apiVersion: 'v1',
      data: { product: { id: 'p-1' } },
    });
  });
});
