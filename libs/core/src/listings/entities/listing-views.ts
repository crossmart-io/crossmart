import type { ChannelCategory, ChannelType } from '@crossmart/connectors';
import type { ChannelConnectionStatus, ListingSource, ListingStatus } from '@crossmart/database';
import type { ListingOverrideView } from './listing-override.js';
import type { ResolvedPrice } from './price-resolution.js';

/** A listing as the merchant sees it: where it stands on the channel. */
export interface ListingSummary {
  id: string;
  status: ListingStatus;
  /** How the product joined the store: by hand, by an import, or by the automatic rule. */
  source: ListingSource;
  externalId: string | null;
  externalUrl: string | null;
  lastError: string | null;
  lastSyncedAt: Date | null;
  /** The channel category it is listed in, on channels that have categories (eBay). */
  category: ChannelCategory | null;
}

/** One row of a connection's listings table. */
export interface ChannelListingRow extends ListingSummary {
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  variantCount: number;
}

export interface ChannelListingPage {
  items: ChannelListingRow[];
  nextCursor: string | null;
  /** How many match in all, for page numbers. */
  total: number;
}

export interface ChannelListingQuery {
  status?: ListingStatus;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}

/** A variant on one channel: the price it gets there and the stock it shows. */
export interface ChannelVariantView {
  variantId: string;
  /** Option values or SKU: "Blue / Large". */
  title: string;
  price: ResolvedPrice;
  /** Null when the variant does not track stock. */
  quantity: number | null;
}

export interface ConnectionSummary {
  id: string;
  channel: ChannelType;
  displayName: string;
  status: ChannelConnectionStatus;
  currencyCode: string;
}

/** A product on one connected channel, for the product editor's Channels card. */
export interface ProductChannelView {
  connection: ConnectionSummary;
  /** Whether the connection's product selection includes the product. */
  selected: boolean;
  listing: ListingSummary | null;
  override: ListingOverrideView | null;
  variants: ChannelVariantView[];
}
