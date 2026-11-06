import type { StockChangedEventData } from '../../webhooks/entities/webhook-event-data.js';
import type { StockMovement } from '../entities/inventory-ledger.js';

/** A movement as written, with the stock it left. */
export interface AppliedMovement {
  movement: StockMovement;
  available: number;
  reserved: number;
}

/** The variant a stock item belongs to, to name it in the event. */
export interface StockVariant {
  productId: string;
  sku: string | null;
}

/** One `inventory.stock_changed` event for the items a ledger write moved. */
export function toStockChangedEventData(
  applied: readonly AppliedMovement[],
  variants: ReadonlyMap<string, StockVariant>,
): StockChangedEventData {
  return {
    items: applied.flatMap(({ movement, available, reserved }) => {
      const variant = variants.get(movement.stock.variantId);
      if (!variant) return [];
      return [
        {
          inventoryItemId: movement.stock.id,
          variantId: movement.stock.variantId,
          productId: variant.productId,
          sku: variant.sku,
          available,
          reserved,
          onHand: available + reserved,
          availableDelta: movement.availableDelta,
          reason: movement.entry.reason,
        },
      ];
    }),
  };
}
