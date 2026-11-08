import type { Prisma } from '@crossmart/database';

/** An order with the store it came from, for "received order #1001 on Outlet". */
export const ORDER_EVENT_SELECT = {
  id: true,
  name: true,
  total: true,
  currencyCode: true,
  connectionId: true,
  createdAt: true,
  connection: { select: { displayName: true } },
} satisfies Prisma.OrderSelect;

export type OrderEventRecord = Prisma.OrderGetPayload<{ select: typeof ORDER_EVENT_SELECT }>;

/** A delivery that gave up, with what it carried and where to. */
export const FAILED_DELIVERY_SELECT = {
  id: true,
  endpointId: true,
  error: true,
  responseStatus: true,
  updatedAt: true,
  event: { select: { type: true } },
  endpoint: { select: { url: true } },
} satisfies Prisma.WebhookDeliverySelect;

export type FailedDeliveryRecord = Prisma.WebhookDeliveryGetPayload<{
  select: typeof FAILED_DELIVERY_SELECT;
}>;
