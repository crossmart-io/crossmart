import type { InventoryMovementReason } from '@crossmart/database';
import type { StockLevel } from '../enums/stock-level.enum.js';

/** The stock of one variant, as the inventory list shows it. */
export interface InventoryRow {
  inventoryItemId: string;
  variantId: string;
  productId: string;
  productTitle: string;
  optionValues: string[];
  sku: string | null;
  imageUrl: string | null;
  tracked: boolean;
  /** Units in the building: available plus reserved. */
  onHand: number;
  /** Units held for open orders. */
  reserved: number;
  /** Units that can still be sold. */
  available: number;
  stockLevel: StockLevel;
  updatedAt: Date;
}

export interface InventoryPage {
  items: InventoryRow[];
  /** Pass as `cursor` to get the next page; null on the last page. */
  nextCursor: string | null;
}

export interface InventoryListQuery {
  /** Matches the SKU or the product title. */
  search?: string;
  stockLevel?: StockLevel;
  cursor?: string;
  limit: number;
}

/** One entry of a variant's stock history. */
export interface InventoryMovementView {
  id: string;
  delta: number;
  reason: InventoryMovementReason;
  /** Stock on hand right after the movement. */
  quantityAfter: number;
  note: string | null;
  /** The user who made the change; null for API keys, system changes and deleted users. */
  userName: string | null;
  /** The API key that made the change, when one did. */
  apiKeyName: string | null;
  createdAt: Date;
}

export interface InventoryMovementPage {
  items: InventoryMovementView[];
  nextCursor: string | null;
}

export interface MovementListQuery {
  cursor?: string;
  limit: number;
}
