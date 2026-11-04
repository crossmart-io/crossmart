/** A variant as a channel holds it, in Crossmart's terms. Prices are decimal strings. */
export interface ExternalVariant {
  externalId: string;
  /** The id stock is set on, where the channel has one (a Shopify InventoryItem GID). */
  externalInventoryId: string | null;
  sku: string | null;
  barcode: string | null;
  optionValues: string[];
  price: string;
  compareAtPrice: string | null;
  /** Whether the channel tracks this variant's stock. */
  tracked: boolean;
  /** Units available at the connection's primary location, when stock is tracked. */
  available: number | null;
  /** Shipping weight in grams, when the channel has one. */
  weightGrams: number | null;
  requiresShipping: boolean;
  taxable: boolean;
  /** Whether the channel keeps selling the variant once it is out of stock. */
  continueSellingWhenOutOfStock: boolean;
  /** What one unit costs the merchant, as a decimal string in the account's currency. */
  unitCost: string | null;
}

export interface ExternalImage {
  url: string;
  altText: string | null;
}

/** A product as a channel holds it, in Crossmart's terms. */
export interface ExternalProduct {
  externalId: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  /** Whether it is for sale on the channel. */
  active: boolean;
  optionNames: string[];
  variants: ExternalVariant[];
  images: ExternalImage[];
  externalUrl: string | null;
}

/** One page of a paginated channel read. Pass `nextCursor` back to read the next page. */
export interface ChannelPage<TItem> {
  items: TItem[];
  nextCursor: string | null;
  /** How many items the whole read covers, when the channel reports it, for progress. */
  totalCount?: number | null;
}
