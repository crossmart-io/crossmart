import type {
  ProductPage,
  ProductStoreBadge,
  ProductSummary,
} from '../../catalog/entities/product-views.js';
import type { ListingDisplayFields } from './listing-views.js';

/** A store a product is in, with the one state the merchant reads for it there. */
export interface DisplayedStoreBadge extends ProductStoreBadge, ListingDisplayFields {}

/** A product list row whose store badges carry their display state. */
export interface DisplayedProductSummary extends Omit<ProductSummary, 'stores'> {
  stores: DisplayedStoreBadge[];
}

/** A page of the product list whose store badges carry their display state. */
export interface DisplayedProductPage extends Omit<ProductPage, 'items'> {
  items: DisplayedProductSummary[];
}
