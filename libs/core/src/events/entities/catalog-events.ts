import type { CatalogChangeKind } from '../enums/catalog-change-kind.enum.js';

/** Products whose catalog data changed, after the change was committed. */
export interface ProductsChangedEvent {
  workspaceId: string;
  productIds: string[];
  kinds: CatalogChangeKind[];
}

/** Stock items whose available quantity changed, after the change was committed. */
export interface StockChangedEvent {
  workspaceId: string;
  inventoryItemIds: string[];
}

/** Reacts to catalog changes, such as by syncing listings. Handlers must not throw. */
export interface CatalogChangeListener {
  onProductsChanged(event: ProductsChangedEvent): Promise<void>;
  onStockChanged(event: StockChangedEvent): Promise<void>;
}
