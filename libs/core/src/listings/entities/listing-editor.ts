import type { ChannelCategory } from '@crossmart/connectors';
import type { ListingVisibility } from '@crossmart/database';
import type { ResolvedPrice } from './price-resolution.js';
import type { ConnectionSummary, ListingDisplayFields, ListingSummary } from './listing-views.js';

/**
 * One field of a listing as its editor shows it: the product's value, the store's override (null
 * when it follows the product), and the value the store gets.
 */
export interface InheritedField<TValue> {
  product: TValue;
  override: TValue | null;
  effective: TValue;
  /** Whether the store overrides it; reverting sets the override back to null. */
  overridden: boolean;
}

/** One variant's prices on the store, each with where it comes from. */
export interface ListingEditorVariant {
  variantId: string;
  /** Option values or SKU: "Blue / Large". */
  title: string;
  sku: string | null;
  /**
   * `product` is the catalog price (workspace currency); `effective` is what the store gets, in
   * its currency: the override, else the pricing rule applied to the catalog price.
   */
  price: InheritedField<string>;
  compareAtPrice: InheritedField<string | null>;
  /** How the effective price was reached, step by step. */
  resolvedPrice: ResolvedPrice;
  /** The stock the store shows; null when the variant does not track stock. */
  quantity: number | null;
}

/** The store's stock limits, which have no product value to follow. */
export interface ListingStockLimits {
  /** Units held back from this store. */
  inventoryBuffer: number | null;
  /** The most units this store shows. */
  maxQuantity: number | null;
}

/** The listing's channel category, on channels that have categories (eBay). */
export interface ListingCategoryField {
  supported: boolean;
  /** Null until the merchant chose one or a publish picked one. */
  value: ChannelCategory | null;
}

/** The item specifics set on the listing; the category's own come from `…/item-specifics`. */
export interface ListingItemSpecificsSummary {
  supported: boolean;
  count: number;
  names: string[];
}

/** One product on one store, for the listing editor: every field with what it inherits. */
export interface ListingEditorView extends ListingDisplayFields {
  productId: string;
  connection: ConnectionSummary;
  /** Whether the store's selection includes the product. */
  selected: boolean;
  listing: ListingSummary | null;
  title: InheritedField<string>;
  descriptionHtml: InheritedField<string>;
  tags: InheritedField<string[]>;
  /** Image URLs in order; an override is a subset of the product's, in its own order. */
  images: InheritedField<string[]>;
  /** The product's value is `VISIBLE` when it is active, else `HIDDEN`. */
  visibility: InheritedField<ListingVisibility>;
  stock: ListingStockLimits;
  variants: ListingEditorVariant[];
  category: ListingCategoryField;
  itemSpecifics: ListingItemSpecificsSummary;
  /** When the overrides last changed; null when the listing has none. */
  overrideUpdatedAt: Date | null;
}
