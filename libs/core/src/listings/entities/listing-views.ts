import type { ChannelCategory, ChannelType, PublishRequirement } from '@crossmart/connectors';
import type { ListingDisplayState } from '../enums/listing-display-state.enum.js';
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
  /** What the channel refused the last publish for lacking, when the merchant can add it. */
  missingRequirement: PublishRequirement | null;
  lastSyncedAt: Date | null;
  /**
   * When a sync or retry queued its publish, update or delist; null once that job finished (or
   * gave up). While set, a selected listing shows `publishing`.
   */
  syncRequestedAt: Date | null;
  /** The channel category it is listed in, on channels that have categories (eBay). */
  category: ChannelCategory | null;
}

/** The one state a merchant reads for a product on a store, and why when it needs a reason. */
export interface ListingDisplayFields {
  displayState: ListingDisplayState;
  /** For `needs_details` and `failed`: what to add, or the channel's message. */
  displayReason: string | null;
  /** For `needs_details`: the requirement to fix first, so "Fix" opens the right place. */
  displayRequirement: PublishRequirement | null;
}

/** One row of a connection's listings table. */
export interface ChannelListingRow extends ListingSummary, ListingDisplayFields {
  productId: string;
  productTitle: string;
  imageUrl: string | null;
  variantCount: number;
}

/** A listing row with the store it is on, for lists that span the workspace's stores. */
export interface StoreListingRow extends ChannelListingRow {
  connectionId: string;
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
export interface ProductChannelView extends ListingDisplayFields {
  connection: ConnectionSummary;
  /** Whether the connection's product selection includes the product. */
  selected: boolean;
  listing: ListingSummary | null;
  override: ListingOverrideView | null;
  variants: ChannelVariantView[];
}
