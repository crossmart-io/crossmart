import type { ListingVisibility } from '@crossmart/database';

/** A fixed price for one variant on one listing. Null fields follow the pricing rule. */
export interface VariantPriceOverrideInput {
  variantId: string;
  price: string | null;
  compareAtPrice: string | null;
}

/**
 * What one listing shows differently from its product. Every field is optional: null (or an
 * absent list) follows the product, so clearing a field hands it back to the catalog.
 */
export interface ListingOverrideInput {
  title: string | null;
  descriptionHtml: string | null;
  /** Replaces the product's tags; an empty list sends none. */
  tags: string[] | null;
  /** The product's image URLs to show, in order. */
  mediaUrls: string[] | null;
  visibility: ListingVisibility | null;
  /** Units held back from this channel. */
  inventoryBuffer: number | null;
  /** The most units this channel shows. */
  maxQuantity: number | null;
  variantPrices: VariantPriceOverrideInput[];
}

export interface ListingOverrideView extends ListingOverrideInput {
  updatedAt: Date;
}
