import type { SortDirection } from '@crossmart/common';
import type { ChannelType } from '@crossmart/connectors';
import type {
  ListingSource,
  ListingStatus,
  OutOfStockPolicy,
  ProductCondition,
  ProductStatus,
} from '@crossmart/database';
import type { CatalogGap } from '../enums/catalog-gap.enum.js';
import type { ProductSort, ProductStoreFilter } from '../enums/product-store-filter.enum.js';

export interface PriceRange {
  min: string;
  max: string;
}

/** One row of the product list. */
/** A store a product is in, as its row's channel icon shows it. */
export interface ProductStoreBadge {
  connectionId: string;
  channel: ChannelType;
  storeName: string;
  /** Where its listing stands there: an error shows first when it has several. */
  status: ListingStatus;
  source: ListingSource;
}

export interface ProductSummary {
  id: string;
  handle: string;
  title: string;
  status: ProductStatus;
  condition: ProductCondition | null;
  vendor: string | null;
  productType: string | null;
  variantCount: number;
  /** Sum of tracked stock across variants; null when no variant tracks stock. */
  totalAvailable: number | null;
  priceRange: PriceRange | null;
  imageUrl: string | null;
  /** The stores it is in, in the order it joined them. */
  stores: ProductStoreBadge[];
  updatedAt: Date;
}

export interface ProductPage {
  items: ProductSummary[];
  /** Pass as `cursor` to get the next page; null on the last page. */
  nextCursor: string | null;
  /** How many match in all, for page numbers. */
  total: number;
}

export interface VariantView {
  id: string;
  position: number;
  sku: string | null;
  barcode: string | null;
  optionValues: string[];
  price: string;
  compareAtPrice: string | null;
  /** What the merchant pays per unit; never shown to buyers. */
  cost: string | null;
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
  /** The item's condition; null uses each store's default condition. */
  condition: ProductCondition | null;
  optionNames: string[];
  variants: VariantView[];
  media: MediaView[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CatalogStats {
  products: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  variants: number;
  /** Tracked variants with nothing available. */
  outOfStockVariants: number;
  /** How many products have each gap, in `CatalogGap` order. */
  gaps: CatalogGapCount[];
}

export interface CatalogGapCount {
  gap: CatalogGap;
  products: number;
}

/** The catalog list filters. Absent ones are not applied. */
export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
  /** Only products that have this gap. */
  gap?: CatalogGap;
  /** Only products with any of these tags. */
  tags?: string[];
  /** Only products of this vendor, ignoring case. */
  vendor?: string;
}

export interface ProductListQuery extends ProductFilters {
  storeFilter?: ProductStoreFilter;
  /** The store `InStore` and `NotInStore` are about. */
  storeId?: string;
  sort: ProductSort;
  direction: SortDirection;
  cursor?: string;
  /** 1-based page number, for tables; it wins over `cursor`. */
  page?: number;
  limit: number;
}
