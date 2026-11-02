import type { ProductStatus } from '@crossmart/database';
import type { CatalogGap } from '../enums/catalog-gap.enum.js';

/** The filters a saved view applies to the product list. Absent ones are not filtered on. */
export interface ProductViewFilters {
  search?: string;
  status?: ProductStatus;
  gap?: CatalogGap;
}

export interface ProductViewDraft extends ProductViewFilters {
  name: string;
}

export interface SavedProductView extends ProductViewDraft {
  id: string;
  createdAt: Date;
}
