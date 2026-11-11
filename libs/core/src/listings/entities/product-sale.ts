import type { ChannelType } from '@crossmart/connectors';
import type { ProductDetail } from '../../catalog/entities/product-views.js';

/** A store a sold product was taken off. */
export interface SoldProductStore {
  connectionId: string;
  channel: ChannelType;
  displayName: string;
}

/** What marking a product sold did. */
export interface ProductSale {
  /** The product as it is now, with every tracked variant at 0 available. */
  product: ProductDetail;
  /** Available units set to 0 across the product's tracked variants. */
  unitsCleared: number;
  /** The stores it was taken off; its listings there are ended or cleared. */
  removedFromStores: SoldProductStore[];
  /** True when it was sold already: no stock was left and no store held it, so nothing changed. */
  alreadySold: boolean;
}

/** The stock of one variant, as marking its product sold reads it. */
export interface SaleStockItem {
  inventoryItemId: string;
  tracked: boolean;
  available: number;
}
