import type { OutOfStockPolicy, ProductStatus } from '@crossmart/database';

export interface PriceRange {
  min: string;
  max: string;
}

/** One row of the product list. */
export interface ProductSummary {
  id: string;
  handle: string;
  title: string;
  status: ProductStatus;
  vendor: string | null;
  productType: string | null;
  variantCount: number;
  /** Sum of tracked stock across variants; null when no variant tracks stock. */
  totalAvailable: number | null;
  priceRange: PriceRange | null;
  imageUrl: string | null;
  updatedAt: Date;
}

export interface ProductPage {
  items: ProductSummary[];
  /** Pass as `cursor` to get the next page; null on the last page. */
  nextCursor: string | null;
}

export interface VariantView {
  id: string;
  position: number;
  sku: string | null;
  barcode: string | null;
  optionValues: string[];
  price: string;
  compareAtPrice: string | null;
  weightGrams: number | null;
  requiresShipping: boolean;
  taxable: boolean;
  outOfStockPolicy: OutOfStockPolicy;
  tracked: boolean;
  available: number;
}

export interface MediaView {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

export interface ProductDetail {
  id: string;
  handle: string;
  title: string;
  descriptionHtml: string;
  vendor: string | null;
  productType: string | null;
  tags: string[];
  status: ProductStatus;
  optionNames: string[];
  variants: VariantView[];
  media: MediaView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductListQuery {
  search?: string;
  status?: ProductStatus;
  cursor?: string;
  limit: number;
}
