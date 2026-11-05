import type { InventoryMovementReason } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import type { StockSnapshot } from './stock-adjustment.js';

/** A stock item row locked for the rest of the transaction, as the ledger read it. */
export interface LockedStock extends StockSnapshot {
  id: string;
  variantId: string;
}

/** Why the stock on hand moved and who moved it, as the ledger entry records it. */
export interface LedgerEntry {
  reason: InventoryMovementReason;
  /** The person, API key or system (orders, imports) behind the change. */
  actor: Actor;
  note?: string | null;
}

/**
 * One change to a locked item. `available` and `reserved` move by their deltas; when the
 * stock on hand (their sum) changes, the entry is written to the ledger with that difference.
 */
export interface StockMovement {
  stock: LockedStock;
  availableDelta: number;
  reservedDelta: number;
  entry: LedgerEntry;
}

/** The stock of an item once a movement is applied. */
export interface StockAfterMovement {
  inventoryItemId: string;
  available: number;
  reserved: number;
}
