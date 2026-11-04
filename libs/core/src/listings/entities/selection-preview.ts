import type { ProductSummary } from '../../catalog/entities/product-views.js';

/** What a product selection rule selects, with how each part contributes. */
export interface SelectionPreview {
  /** Products the rule selects. */
  total: number;
  /** Products the filter matches, before the manual lists. */
  matchingFilter: number;
  /** Products added by hand that the filter does not match. */
  addedManually: number;
  /** Products the filter matches that were removed by hand. */
  removedManually: number;
  items: ProductSummary[];
  nextCursor: string | null;
}

export interface SelectionPreviewQuery {
  cursor?: string;
  limit: number;
}
