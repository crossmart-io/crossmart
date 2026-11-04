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

/**
 * Products about to be deleted, before the delete runs, so listeners can keep what they need
 * from rows that are deleted with them (such as the ids of their listings on channels).
 */
export interface ProductsDeletingEvent {
  workspaceId: string;
  productIds: string[];
}

/** Reacts to catalog changes, such as by syncing listings. Handlers must not throw. */
export interface CatalogChangeListener {
  onProductsChanged(event: ProductsChangedEvent): Promise<void>;
  onStockChanged(event: StockChangedEvent): Promise<void>;
  onProductsDeleting(event: ProductsDeletingEvent): Promise<void>;
}
