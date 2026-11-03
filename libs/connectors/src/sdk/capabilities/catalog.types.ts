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
  /** Units available at the connection's primary location, when stock is tracked. */
  available: number | null;
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
}
