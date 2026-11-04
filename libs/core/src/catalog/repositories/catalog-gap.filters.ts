import type { Prisma } from '@crossmart/database';
import { CatalogGap } from '../enums/catalog-gap.enum.js';

/** Products that have the gap. A product counts once, however many of its variants lack the value. */
export const CATALOG_GAP_FILTERS: Record<CatalogGap, Prisma.ProductWhereInput> = {
  [CatalogGap.Images]: { media: { none: {} } },
  [CatalogGap.Description]: { descriptionHtml: '' },
  [CatalogGap.Sku]: { variants: { some: { sku: null } } },
  [CatalogGap.Barcode]: { variants: { some: { barcode: null } } },
  [CatalogGap.OutOfStock]: {
    variants: { some: { inventoryItem: { tracked: true, available: { lte: 0 } } } },
  },
};
