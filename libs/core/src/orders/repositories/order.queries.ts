import type { Prisma } from '@crossmart/database';

export const ORDER_SUMMARY_INCLUDE = {
  connection: { select: { channel: true, displayName: true } },
  lines: { select: { quantity: true, variantId: true } },
} satisfies Prisma.OrderInclude;

export const ORDER_DETAIL_INCLUDE = {
  connection: { select: { channel: true, displayName: true } },
  lines: {
    include: { variant: { select: { productId: true } } },
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.OrderInclude;

export type OrderSummaryRecord = Prisma.OrderGetPayload<{ include: typeof ORDER_SUMMARY_INCLUDE }>;
export type OrderDetailRecord = Prisma.OrderGetPayload<{ include: typeof ORDER_DETAIL_INCLUDE }>;
