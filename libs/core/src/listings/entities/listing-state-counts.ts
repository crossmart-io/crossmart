import type { ListingDisplayState } from '../enums/listing-display-state.enum.js';

/** How many of the catalog's products are in each display state on one store. */
export type ListingStateCounts = Record<ListingDisplayState, number>;

/** Products that need details on one store, and how many of them the channel never refused. */
export interface NeedsDetailsCounts {
  total: number;
  /** Those not failed: selected and not sent yet. */
  unsent: number;
}
