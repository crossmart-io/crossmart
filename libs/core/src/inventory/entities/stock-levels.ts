import type { InventoryMovementReason } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';

/** The stock item of a variant, found by its SKU. */
export interface StockItemBySku {
  inventoryItemId: string;
  productId: string;
  sku: string;
  tracked: boolean;
}

/** The available stock one item should hold, such as a row of an inventory file. */
export interface StockTarget {
  inventoryItemId: string;
  available: number;
}

/** Why a batch of stock levels is set, and by whom; every changed item gets this ledger entry. */
export interface StockLevelsChange {
  reason: InventoryMovementReason;
  actor: Actor;
}
