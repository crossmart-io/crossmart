import { InventoryMovementReason, type Prisma } from '@crossmart/database';
import type { LineStockChange } from '../rules/order-line-stock.js';

type Transaction = Prisma.TransactionClient;

/** A stock item an order touches, locked for the transaction. */
export interface LockedItem {
  id: string;
  variantId: string;
  productId: string;
  productTitle: string;
  tracked: boolean;
  available: number;
  reserved: number;
}

/** The changes of every line on one stock item, summed. */
export interface ItemChange {
  reservedDelta: number;
  availableDelta: number;
  shipped: number;
}

/** Locks the stock of these variants, in id order so concurrent orders cannot deadlock. */
export async function lockItems(
  tx: Transaction,
  workspaceId: string,
  variantIds: string[],
): Promise<Map<string, LockedItem>> {
  if (variantIds.length === 0) return new Map();
  const rows = await tx.$queryRaw<LockedItem[]>`
    SELECT i.id, i.variant_id AS "variantId", v.product_id AS "productId", p.title AS "productTitle",
           i.tracked, i.available, i.reserved
    FROM inventory_items i
    JOIN variants v ON v.id = i.variant_id
    JOIN products p ON p.id = v.product_id
    WHERE i.workspace_id = ${workspaceId}::uuid AND i.variant_id = ANY(${variantIds}::uuid[])
    ORDER BY i.id
    FOR UPDATE OF i`;
  return new Map(rows.map((row) => [row.variantId, row]));
}

/** Adds one line's change to its item's total. */
export function addChange(
  changes: Map<string, ItemChange>,
  itemId: string,
  change: LineStockChange,
): void {
  const sum = changes.get(itemId) ?? { reservedDelta: 0, availableDelta: 0, shipped: 0 };
  changes.set(itemId, {
    reservedDelta: sum.reservedDelta + change.reservedDelta,
    availableDelta: sum.availableDelta + change.availableDelta,
    shipped: sum.shipped + change.shipped,
  });
}

/**
 * Writes one item's change: `available` and `reserved` move together, and shipped units are
 * a ledger entry, since they leave the stock on hand. Returns the item's new available stock.
 */
export async function applyItemChange(
  tx: Transaction,
  item: LockedItem,
  change: ItemChange,
  context: { workspaceId: string; orderName: string },
): Promise<number> {
  const available = item.available + change.availableDelta;
  const reserved = item.reserved + change.reservedDelta;
  await tx.inventoryItem.update({ where: { id: item.id }, data: { available, reserved } });
  if (change.shipped > 0) {
    await tx.inventoryMovement.create({
      data: {
        workspaceId: context.workspaceId,
        inventoryItemId: item.id,
        delta: -change.shipped,
        reason: InventoryMovementReason.ORDER_SHIPPED,
        quantityAfter: available + reserved,
        note: context.orderName,
        actorUserId: null,
        apiKeyId: null,
      },
    });
  }
  return available;
}
