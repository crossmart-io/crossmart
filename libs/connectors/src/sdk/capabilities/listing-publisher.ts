import type { ChannelSession } from '../auth/channel-session.js';
import type { ExternalProduct, ExternalVariant } from './catalog.types.js';

/** What to publish: a product in Crossmart's terms, keyed by Crossmart variant ids. */
export interface ListingDraft {
  productId: string;
  product: Omit<ExternalProduct, 'externalId' | 'externalUrl' | 'variants'>;
  variants: (Omit<ExternalVariant, 'externalId' | 'externalInventoryId'> & { variantId: string })[];
}

/** The ids the channel gave a published listing, to store as `Listing` / `ListingVariant`. */
export interface PublishedListing {
  externalId: string;
  externalUrl: string | null;
  active: boolean;
  variants: { variantId: string; externalId: string; externalInventoryId: string | null }[];
}

export interface PriceUpdate {
  externalProductId: string;
  externalVariantId: string;
  price: string;
  compareAtPrice: string | null;
}

/** `ChannelCapability.PublishListings` and `UpdatePrice`: writes listings to the channel. */
export interface ListingPublisher {
  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing>;
  update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing>;
  delist(session: ChannelSession, externalId: string): Promise<void>;
  updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void>;
}
