import type { SortDirection } from '@crossmart/common';
import type {
  ChannelProductSort,
  ChannelProductState,
} from '../enums/channel-product-state.enum.js';
import type { ChannelProductView } from '../enums/channel-product-view.enum.js';
import type { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import type { ListingDisplayFields, ListingSummary } from './listing-views.js';
import type { DisplayedProductSummary } from './store-badge-display.js';

/** A catalog product as one connection sees it: should it be there, and is it. */
export interface ChannelProductRow extends ListingDisplayFields {
  product: DisplayedProductSummary;
  state: ChannelProductState;
  /** The product's listing on the connection, once one exists. */
  listing: ListingSummary | null;
}

/** Products in each state, and in the two groups a merchant acts on. */
export interface ChannelProductCounts extends Record<ChannelProductState, number> {
  /** Products whose display state is `needs_details` (pending or failed ones). */
  needsDetails: number;
  /** Products failed or needing details, each once: the needs attention view. */
  needsAttention: number;
}

export interface ChannelProductPage {
  items: ChannelProductRow[];
  /** Products in each state, for the filter; they follow `search` but not `state`. */
  counts: ChannelProductCounts;
  nextCursor: string | null;
  /** How many match in all, for page numbers. */
  total: number;
}

export interface ChannelProductQuery {
  state?: ChannelProductState;
  /** Only products showing this display state; it may combine with `state`. */
  displayState?: ListingDisplayState;
  /** Only the products of this view; it may combine with `state` and `displayState`. */
  view?: ChannelProductView;
  /** Matches title, handle or SKU. */
  search?: string;
  sort: ChannelProductSort;
  direction: SortDirection;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}
