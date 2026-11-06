import type { ListingDisplayState } from '../enums/listing-display-state.enum.js';

/** How many of the catalog's products are in each display state on one store. */
export type ListingStateCounts = Record<ListingDisplayState, number>;
