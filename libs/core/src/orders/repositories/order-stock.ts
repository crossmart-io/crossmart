import type { Prisma } from '@crossmart/database';
import type { LineStockChange } from '../rules/order-line-stock.js';

type Transaction = Prisma.TransactionClient;

/** The changes of every line on one stock item, summed. */
export interface ItemChange {
  reservedDelta: number;
  availableDelta: number;
}

/** The product a stock item belongs to, to name it in the activity log. */
export interface ItemProduct {
  productId: string;
  productTitle: string;
}

/** Adds one line's change to its item's total. */
export function addChange(
  changes: Map<string, ItemChange>,
  itemId: string,
  change: LineStockChange,
): void {
  const sum = changes.get(itemId) ?? { reservedDelta: 0, availableDelta: 0 };
  changes.set(itemId, {
    reservedDelta: sum.reservedDelta + change.reservedDelta,
    availableDelta: sum.availableDelta + change.availableDelta,
  });
}

/** The product of each of these variants, by variant id. */
export async function findProductsOf(
  tx: Transaction,
  workspaceId: string,
  variantIds: string[],
): Promise<Map<string, ItemProduct>> {
  if (variantIds.length === 0) return new Map();
  const variants = await tx.variant.findMany({
    where: { workspaceId, id: { in: variantIds } },
    select: { id: true, productId: true, product: { select: { title: true } } },
  });
  return new Map(
    variants.map((variant) => [
      variant.id,
      { productId: variant.productId, productTitle: variant.product.title },
    ]),
  );
}
