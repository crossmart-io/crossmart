import { Prisma } from '@crossmart/database';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { orderReceivedEvent } from './order-events.js';
import { webhookFailureEvent } from './webhook-failure-events.js';

const AT = new Date('2026-11-08T10:00:00.000Z');

describe('order and webhook events', () => {
  it('names a received order with its store and total', () => {
    const event = orderReceivedEvent({
      id: 'o-1',
      name: '#1001',
      total: new Prisma.Decimal('39'),
      currencyCode: 'USD',
      connectionId: 'c-1',
      createdAt: AT,
      connection: { displayName: 'Clayworks Shop' },
    });
    expect(event).toMatchObject({
      id: 'order:o-1',
      type: WorkspaceEventType.OrderReceived,
      summary: 'Received order #1001 on Clayworks Shop',
      detail: '$39.00',
      refs: { orderId: 'o-1', connectionId: 'c-1' },
    });
  });

  it('shows only the host of a failing webhook endpoint, never its path or query', () => {
    const event = webhookFailureEvent({
      id: 'd-1',
      endpointId: 'w-1',
      error: 'The endpoint answered with HTTP 500',
      responseStatus: 500,
      updatedAt: AT,
      event: { type: 'order.created' },
      endpoint: { url: 'https://hooks.example.com/in/secret-token?key=abc' },
    });
    expect(event.summary).toBe('Could not deliver order.created to hooks.example.com');
    expect(event.summary).not.toContain('secret');
    expect(event).toMatchObject({ failed: true, refs: { webhookEndpointId: 'w-1' } });
  });
});
