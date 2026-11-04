import type { EbayCondition } from '../listing/ebay-condition.enum.js';

/** Item specifics: aspect name to its values, such as `{ Brand: ["Acme"], Size: ["M"] }`. */
export type EbayAspects = Record<string, string[]>;

/** The `product` of an inventory item: what buyers read about it. */
export interface EbayProductDetails {
  title: string;
  description: string;
  imageUrls: string[];
  aspects: EbayAspects;
  brand?: string;
  upc?: string[];
  ean?: string[];
}

/** `PUT /inventory_item/{sku}`: one variant, its condition and its stock. */
export interface EbayInventoryItemBody {
  availability: { shipToLocationAvailability: { quantity: number } };
  condition: EbayCondition;
  product: EbayProductDetails;
}

/** An aspect the variants differ by, with every value they use. */
export interface EbaySpecification {
  name: string;
  values: string[];
}

/** `PUT /inventory_item_group/{key}`: a multi-variant product, listed as one listing. */
export interface EbayInventoryItemGroupBody {
  title: string;
  description: string;
  imageUrls: string[];
  aspects: EbayAspects;
  variantSKUs: string[];
  variesBy: { specifications: EbaySpecification[] };
}
