import type { ProductStatus } from '@crossmart/database';
import type { BulkProductAction } from '../enums/bulk-product-action.enum.js';

/** One change applied to many products. The action decides which fields it carries. */
export type BulkProductChange =
  | { action: BulkProductAction.SetStatus; status: ProductStatus }
  | { action: BulkProductAction.AddTags; tags: string[] }
  | { action: BulkProductAction.RemoveTags; tags: string[] }
  /** Every variant's price (and compare-at price) moves by this percentage, rounded to cents. */
  | { action: BulkProductAction.AdjustPrices; percent: number }
  | { action: BulkProductAction.Delete };

export interface BulkProductResult {
  /** Products changed. Ids from another workspace, or already deleted, are not counted. */
  affected: number;
}
