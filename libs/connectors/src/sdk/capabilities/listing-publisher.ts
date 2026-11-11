import type { ChannelSession } from '../auth/channel-session.js';
import type { ChannelSettings } from '../channel-settings.js';
import type { ItemCondition } from '../listings/item-condition.enum.js';
import type { ExternalProduct, ExternalVariant } from './catalog.types.js';
import type { PublishPrerequisites } from '../publishing/unmet-publish-requirement.js';
import type { ChannelCategory } from './taxonomy-provider.js';

/**
 * A variant to publish: the channel's own variant shape, keyed by the Crossmart variant id.
 * When `tracked`, `available` is the opening stock; `unitCost` is kept by channels for margin
 * reports and never shown to buyers.
 */
export type ListingDraftVariant = Omit<ExternalVariant, 'externalId' | 'externalInventoryId'> & {
  variantId: string;
  /** The variant's id on the channel, once published; updates edit it in place. */
  externalVariantId?: string | null;
};

/** An item specific a merchant set on a listing, such as `Material: ["Stoneware"]`. */
export interface ItemSpecific {
  name: string;
  values: string[];
}

/** What to publish: a product in Crossmart's terms, keyed by Crossmart variant ids. */
export interface ListingDraft {
  productId: string;
  product: Omit<ExternalProduct, 'externalId' | 'externalUrl' | 'variants'>;
  variants: ListingDraftVariant[];
  /**
   * False when the images are those last published, so an update need not send them again
   * (channels re-download sent images). Publishing always sends them.
   */
  imagesChanged?: boolean;
  /**
   * The connection's account settings as its connector validated them, for channels whose
   * listings need account-level choices (eBay's business policies and ship-from location).
   */
  accountSettings?: ChannelSettings | null;
  /** The category the listing was put in on the channel, chosen by the merchant or earlier. */
  category?: ChannelCategory | null;
  /**
   * Item specifics the merchant set on the listing, for channels that have them (eBay). They
   * take precedence over the ones the connector derives, except the variants' own options.
   */
  itemSpecifics?: ItemSpecific[];
  /**
   * The item's condition, when the merchant set one on the product. Channels with conditions
   * map it to their own; without it they use the connection's default (eBay) or `new`.
   */
  condition?: ItemCondition | null;
}

/** The ids the channel gave a published listing, to store as `Listing` / `ListingVariant`. */
export interface PublishedListing {
  externalId: string;
  externalUrl: string | null;
  active: boolean;
  variants: { variantId: string; externalId: string; externalInventoryId: string | null }[];
  /** The category the channel listed it in, when it needs one; stored for later updates. */
  category?: ChannelCategory | null;
}

/** What a channel may need, besides the listing's id, to find a listing it published. */
export interface ListingReference {
  productId: string;
  /** The variants' ids on the channel, as last published (eBay SKUs). */
  variantExternalIds: readonly string[];
}

export interface PriceUpdate {
  externalProductId: string;
  externalVariantId: string;
  price: string;
  compareAtPrice: string | null;
}

/**
 * `ChannelCapability.PublishListings` and `UpdatePrice`: writes listings to the channel. Its
 * optional prerequisites say what blocks a publish before one is tried.
 */
export interface ListingPublisher extends PublishPrerequisites {
  publish(session: ChannelSession, draft: ListingDraft): Promise<PublishedListing>;
  update(
    session: ChannelSession,
    externalId: string,
    draft: ListingDraft,
  ): Promise<PublishedListing>;
  /** `reference` is always passed by Crossmart; connectors that need it reject calls without it. */
  delist(session: ChannelSession, externalId: string, reference?: ListingReference): Promise<void>;
  updatePrices(session: ChannelSession, updates: readonly PriceUpdate[]): Promise<void>;
}
