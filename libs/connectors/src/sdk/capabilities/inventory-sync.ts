import type { ChannelSession } from '../auth/channel-session.js';

export interface InventoryQuantityUpdate {
  externalInventoryId: string;
  /** The channel location; the connection's primary location when omitted. */
  externalLocationId?: string;
  available: number;
}

export interface InventoryUpdateFailure {
  externalInventoryId: string;
  message: string;
}

/** `ChannelCapability.UpdateInventory`: sets available quantities, in batches. */
export interface InventorySync {
  /** The largest batch one `setQuantities` call accepts. */
  readonly maxBatchSize: number;
  /** Applies what it can and reports the rest, so one bad item does not fail a batch. */
  setQuantities(
    session: ChannelSession,
    updates: readonly InventoryQuantityUpdate[],
  ): Promise<InventoryUpdateFailure[]>;
  /**
   * The available quantity of each item at the connection's primary location, so a
   * reconciliation sends only what drifted. Items the channel does not stock there are absent.
   * Optional: connectors without it have every item re-sent.
   */
  readQuantities?(
    session: ChannelSession,
    externalInventoryIds: readonly string[],
  ): Promise<Map<string, number>>;
}
