import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type { ProductDraft } from '../../../entities/product-draft.js';

/** A valid product draft with one variant per SKU (sized S0, S1… when there are several). */
export function productDraft(handle: string, ...skus: string[]): ProductDraft {
  return {
    handle,
    title: handle,
    descriptionHtml: '',
    tags: [],
    status: ProductStatus.ACTIVE,
    optionNames: skus.length > 1 ? ['Size'] : [],
    variants: skus.map((sku, index) => ({
      sku,
      optionValues: skus.length > 1 ? [`S${index}`] : [],
      price: '1.00',
      requiresShipping: true,
      taxable: true,
      outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
      inventory: { tracked: true, quantity: 1 },
    })),
    media: [],
  };
}
