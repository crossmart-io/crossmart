import type { InventoryMovementReason } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { StockAdjustmentMode } from '../enums/stock-adjustment-mode.enum.js';

/** A manual change to the stock on hand of one variant. */
export interface StockAdjustment {
  mode: StockAdjustmentMode;
  /** Units to add or remove (`delta`), or the new stock on hand (`set`). */
  quantity: number;
  reason: InventoryMovementReason;
  note?: string;
  /** Who made the change: a user, or the API key an agent or script used. */
  actor: Actor;
}

/** The stock of an item as it is locked for an adjustment. */
export interface StockSnapshot {
  tracked: boolean;
  available: number;
  reserved: number;
}
