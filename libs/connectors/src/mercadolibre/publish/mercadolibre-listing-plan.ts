import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import type { ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import type { MercadoLibreSettings } from '../mercadolibre-settings.js';
import type { MercadoLibreAttributeIndex } from './mercadolibre-attributes.js';

/** Everything one listing write needs, resolved before the first write to Mercado Libre. */
export interface MercadoLibreListingPlan {
  accessToken: string;
  draft: ListingDraft;
  settings: MercadoLibreSettings;
  category: ChannelCategory;
  attributes: MercadoLibreAttributeIndex;
}

/** Where a variant ended up: its item, or a variation of the listing's item. */
export interface PublishedVariantKey {
  variantId: string;
  key: string;
}

/** What a write left on Mercado Libre. */
export interface MercadoLibreListingOutcome {
  /** The listing's item; with User Products, the item of its first variant. */
  itemId: string;
  url: string | null;
  active: boolean;
  variants: PublishedVariantKey[];
}

/** Writes a listing in one of Mercado Libre's two item models. */
export interface MercadoLibreListingWriter {
  publish(plan: MercadoLibreListingPlan): Promise<MercadoLibreListingOutcome>;
  update(plan: MercadoLibreListingPlan, itemId: string): Promise<MercadoLibreListingOutcome>;
}
