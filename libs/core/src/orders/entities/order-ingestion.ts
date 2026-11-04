import type { ExternalOrder } from '@crossmart/connectors';

/** An order to store for one connection, with the Crossmart variant each line sells. */
export interface OrderToStore {
  workspaceId: string;
  connectionId: string;
  order: ExternalOrder;
  /** By line id; lines that match no variant are kept without holding stock. */
  variantIds: ReadonlyMap<string, string>;
}

/** A tracked stock item an order left below zero: the units were sold twice. */
export interface OversoldItem {
  inventoryItemId: string;
  productId: string;
  productTitle: string;
  available: number;
}

export interface StoredOrder {
  /** False when a newer copy of the order was already stored, so nothing changed. */
  applied: boolean;
  /** Tracked stock items whose quantities changed, for channel fan-out. */
  changedInventoryItemIds: string[];
  oversold: OversoldItem[];
}

/** A connected account and the channel order it says changed. */
export interface OrderRef {
  workspaceId: string;
  connectionId: string;
  externalOrderId: string;
}
