import { AMOUNT_FRACTION_DIGITS, formatCurrency } from '@crossmart/common';
import { ActivityActorType } from '@crossmart/database';
import type { OrderEventRecord } from '../repositories/workspace-event.queries.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { eventId, type WorkspaceEventDraft } from './workspace-event-kinds.js';

export const ORDER_EVENT_PREFIX = 'order';

export const ORDER_EVENT_COPY = {
  received: (name: string, store: string) => `Received order ${name} on ${store}`,
} as const;

/** An order as it arrived from its store. */
export function orderReceivedEvent(order: OrderEventRecord): WorkspaceEventDraft {
  return {
    id: eventId(ORDER_EVENT_PREFIX, order.id),
    type: WorkspaceEventType.OrderReceived,
    summary: ORDER_EVENT_COPY.received(order.name, order.connection.displayName),
    detail: formatCurrency(order.total.toFixed(AMOUNT_FRACTION_DIGITS), order.currencyCode),
    actor: { type: ActivityActorType.SYSTEM, name: null, agentName: null },
    refs: { orderId: order.id, connectionId: order.connectionId },
    itemCount: null,
    occurredAt: order.createdAt,
  };
}
