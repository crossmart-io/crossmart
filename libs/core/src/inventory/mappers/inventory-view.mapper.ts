import type { InventoryMovementView, InventoryRow } from '../entities/inventory-views.js';
import type {
  InventoryMovementRecord,
  InventoryRowRecord,
} from '../repositories/inventory.queries.js';
import { toStockLevel } from '../rules/stock-level.js';

export function toInventoryRow(record: InventoryRowRecord): InventoryRow {
  const { variant } = record;
  return {
    inventoryItemId: record.id,
    variantId: record.variantId,
    productId: variant.productId,
    productTitle: variant.product.title,
    optionValues: variant.optionValues,
    sku: variant.sku,
    imageUrl: variant.product.media[0]?.url ?? null,
    tracked: record.tracked,
    onHand: record.available + record.reserved,
    reserved: record.reserved,
    available: record.available,
    stockLevel: toStockLevel(record.tracked, record.available),
    updatedAt: record.updatedAt,
  };
}

export function toMovementView(record: InventoryMovementRecord): InventoryMovementView {
  return {
    id: record.id,
    delta: record.delta,
    reason: record.reason,
    quantityAfter: record.quantityAfter,
    note: record.note,
    userName: record.actorUser?.name ?? null,
    apiKeyName: record.apiKey?.name ?? null,
    createdAt: record.createdAt,
  };
}
