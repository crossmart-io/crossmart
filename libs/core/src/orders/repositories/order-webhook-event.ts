import type { Prisma } from '@crossmart/database';
import { toAmount } from '../../catalog/mappers/decimal-amount.mapper.js';
import type { OrderEventData } from '../../webhooks/entities/webhook-event-data.js';

type Transaction = Prisma.TransactionClient;

const ORDER_EVENT_SELECT = {
  id: true,
  externalId: true,
  name: true,
  status: true,
  currencyCode: true,
  total: true,
  placedAt: true,
  connectionId: true,
  connection: { select: { channel: true } },
  lines: {
    select: {
      externalId: true,
      sku: true,
      title: true,
      quantity: true,
      unitPrice: true,
      variantId: true,
    },
    orderBy: { externalId: 'asc' },
  },
} satisfies Prisma.OrderSelect;

type OrderEventRecord = Prisma.OrderGetPayload<{ select: typeof ORDER_EVENT_SELECT }>;

function toOrderEventData({ connection, lines, ...order }: OrderEventRecord): OrderEventData {
  return {
    order: {
      ...order,
      channel: connection.channel,
      total: toAmount(order.total),
      placedAt: order.placedAt.toISOString(),
      lines: lines.map((line) => ({ ...line, unitPrice: toAmount(line.unitPrice) })),
    },
  };
}

/** The order as an `order.*` event carries it, read in the transaction that stored it. */
export async function readOrderEventData(
  tx: Transaction,
  workspaceId: string,
  orderId: string,
): Promise<OrderEventData[]> {
  const order = await tx.order.findFirst({
    where: { id: orderId, workspaceId },
    select: ORDER_EVENT_SELECT,
  });
  return order ? [toOrderEventData(order)] : [];
}
