import type { ProductSummary } from '../../catalog/entities/product-views.js';
import type { SortDirection } from '@crossmart/common';
import type {
  ChannelProductSort,
  ChannelProductState,
} from '../enums/channel-product-state.enum.js';
import type { ListingDisplayFields, ListingSummary } from './listing-views.js';

/** A catalog product as one connection sees it: should it be there, and is it. */
export interface ChannelProductRow extends ListingDisplayFields {
  product: ProductSummary;
  state: ChannelProductState;
  /** The product's listing on the connection, once one exists. */
  listing: ListingSummary | null;
}

export type ChannelProductCounts = Record<ChannelProductState, number>;

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
  /** Matches title, handle or SKU. */
  search?: string;
  sort: ChannelProductSort;
  direction: SortDirection;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}
