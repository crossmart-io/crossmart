import type { ChannelConnectionStatus, ListingStatus } from '@crossmart/database';
import type { InventoryRow } from '../../inventory/entities/inventory-views.js';

export interface StockLevelCounts {
  inStock: number;
  /** Above zero and at most `lowStockThreshold`. */
  lowStock: number;
  outOfStock: number;
  /** Variants that do not track stock. */
  untracked: number;
}

export interface InventoryValue {
  /** Units on hand times their cost; variants without a cost are left out. */
  atCost: string;
  /** Units on hand times their price. */
  atPrice: string;
  /** Units on hand: available plus held for orders; oversold stock counts as none. */
  unitsOnHand: number;
  /** Variants with stock on hand but no cost, so `atCost` misses them. */
  variantsWithoutCost: number;
}

export interface ListingStatusCount {
  status: ListingStatus;
  count: number;
}

export interface StoreHealth {
  connectionId: string;
  channel: string;
  displayName: string;
  status: ChannelConnectionStatus;
  lastSyncedAt: Date | null;
  /** Listings per status, every status included, in the order of `ListingStatus`. */
  listings: ListingStatusCount[];
}

export interface InventoryReport {
  currencyCode: string;
  value: InventoryValue;
  stockLevels: StockLevelCounts;
  lowStockThreshold: number;
  /** Tracked variants out of stock or low, fewest available first, at most a few. */
  lowestStock: InventoryRow[];
  /** Every store of the workspace, oldest first. */
  stores: StoreHealth[];
}
