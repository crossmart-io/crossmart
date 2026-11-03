import { SortDirection, sortWithTiebreak } from '@crossmart/common';
import type { Prisma } from '@crossmart/database';
import { InventorySort } from '../enums/inventory-sort.enum.js';

const ASCENDING = 'asc' as const;

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
function byTitle(direction: SortDirection): Prisma.InventoryItemOrderByWithRelationInput[] {
  return [
    { variant: { product: { title: direction } } },
    { variant: { productId: direction } },
    { variant: { position: ASCENDING } },
    { id: direction },
  ];
}

/** The inventory table's order. Each ends on the id, so equal rows keep a stable order. */
export function inventoryRowOrder(
  sort: InventorySort = InventorySort.Title,
  direction: SortDirection = SortDirection.Asc,
): Prisma.InventoryItemOrderByWithRelationInput[] {
  switch (sort) {
    case InventorySort.Title:
      return byTitle(direction);
    case InventorySort.Available:
      return sortWithTiebreak('available', direction);
    case InventorySort.UpdatedAt:
      return sortWithTiebreak('updatedAt', direction);
  }
}

export const MOVEMENT_INCLUDE = {
  actorUser: { select: { name: true } },
  apiKey: { select: { name: true } },
} satisfies Prisma.InventoryMovementInclude;

export type InventoryRowRecord = Prisma.InventoryItemGetPayload<{
  include: typeof INVENTORY_ROW_INCLUDE;
}>;
export type InventoryMovementRecord = Prisma.InventoryMovementGetPayload<{
  include: typeof MOVEMENT_INCLUDE;
}>;
