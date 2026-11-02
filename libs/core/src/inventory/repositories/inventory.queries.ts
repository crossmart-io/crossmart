import type { Prisma } from '@crossmart/database';

const ASCENDING = 'asc' as const;
const DESCENDING = 'desc' as const;

/** The variant and product columns an inventory row shows, loaded in batched queries. */
export const INVENTORY_ROW_INCLUDE = {
  variant: {
    select: {
      productId: true,
      sku: true,
      optionValues: true,
      product: {
        select: {
          title: true,
          media: { select: { url: true }, orderBy: { position: ASCENDING }, take: 1 },
        },
      },
    },
  },
} satisfies Prisma.InventoryItemInclude;

/** Product title, then the variants in the order the product lists them. */
export const INVENTORY_ROW_ORDER = [
  { variant: { product: { title: ASCENDING } } },
  { variant: { productId: ASCENDING } },
  { variant: { position: ASCENDING } },
  { id: ASCENDING },
] satisfies Prisma.InventoryItemOrderByWithRelationInput[];

export const MOVEMENT_INCLUDE = {
  actorUser: { select: { name: true } },
  apiKey: { select: { name: true } },
} satisfies Prisma.InventoryMovementInclude;

/** Newest first. */
export const MOVEMENT_ORDER = [
  { createdAt: DESCENDING },
  { id: DESCENDING },
] satisfies Prisma.InventoryMovementOrderByWithRelationInput[];

export type InventoryRowRecord = Prisma.InventoryItemGetPayload<{
  include: typeof INVENTORY_ROW_INCLUDE;
}>;
export type InventoryMovementRecord = Prisma.InventoryMovementGetPayload<{
  include: typeof MOVEMENT_INCLUDE;
}>;
