import type { ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionStatus } from '@crossmart/database';
import type { ListingDisplayState } from '../../listings/enums/listing-display-state.enum.js';
import type { StoreListingRow } from '../../listings/entities/listing-views.js';

export interface ListingStateCount {
  state: ListingDisplayState;
  count: number;
}

/** One store and how the catalog stands on it, in the states its product list shows. */
export interface StoreListingHealth {
  connectionId: string;
  channel: ChannelType;
  displayName: string;
  status: ChannelConnectionStatus;
  /** Why the store needs reconnecting or is in error; null otherwise. */
  statusReason: string | null;
  lastSyncedAt: Date | null;
  /** Products per display state, every state included, in the order of `ListingDisplayState`. */
  states: ListingStateCount[];
  /** Listings the channel refused on their last sync. */
  failedListings: number;
}

export interface ListingHealthReport {
  /** Every store of the workspace, oldest first. */
  stores: StoreListingHealth[];
  /** The latest failed listings across the stores, latest first. */
  recentFailures: StoreListingRow[];
  /** Failed listings in all, across the stores. */
  failedListings: number;
}
