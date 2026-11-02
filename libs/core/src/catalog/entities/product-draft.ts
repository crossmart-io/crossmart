import type { OutOfStockPolicy, ProductStatus } from '@crossmart/database';

/** A product ready to be written to the catalog, whether typed in, sent by an agent or imported. */
export interface ProductDraft {
  handle: string;
  title: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  status: ProductStatus;
  optionNames: string[];
  variants: VariantDraft[];
  media: MediaDraft[];
}

export interface VariantDraft {
  sku?: string;
  barcode?: string;
  optionValues: string[];
  /** Exact decimal string, e.g. "89.00". */
  price: string;
  compareAtPrice?: string;
  weightGrams?: number;
  requiresShipping: boolean;
  taxable: boolean;
  outOfStockPolicy: OutOfStockPolicy;
  inventory: InventoryDraft;
}

export interface InventoryDraft {
  tracked: boolean;
  /** Opening stock, written to the ledger as one movement. */
  quantity: number;
}

export interface MediaDraft {
  url: string;
  altText?: string;
}
