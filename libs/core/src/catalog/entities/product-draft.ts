import type { OutOfStockPolicy, ProductCondition, ProductStatus } from '@crossmart/database';

/** A product ready to be written to the catalog, whether typed in, sent by an agent or imported. */
export interface ProductDraft {
  handle: string;
  title: string;
  descriptionHtml: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  status: ProductStatus;
  /**
   * The item's condition. Absent keeps the product's current one (none for a new product) and
   * null clears it; a product without one is listed in each store's default condition.
   */
  condition?: ProductCondition | null;
  optionNames: string[];
  variants: VariantDraft[];
  media: MediaDraft[];
}

export interface VariantDraft {
  /** Set when editing an existing variant; absent for a new one. */
  id?: string;
  sku?: string;
  barcode?: string;
  optionValues: string[];
  /** Exact decimal string, e.g. "89.00". */
  price: string;
  compareAtPrice?: string;
  /** What the merchant pays per unit, as a decimal string. Never shown to buyers. */
  cost?: string;
  weightGrams?: number;
  requiresShipping: boolean;
  taxable: boolean;
  outOfStockPolicy: OutOfStockPolicy;
  inventory: InventoryDraft;
}

export interface InventoryDraft {
  tracked: boolean;
  /**
   * Stock on hand. For a new variant it is the opening balance (none when absent); for an
   * existing one the difference from the current stock is written to the ledger as an
   * adjustment, and absent keeps the current stock.
   */
  quantity?: number;
}

export interface MediaDraft {
  url: string;
  altText?: string;
}
