import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import {
  ContentGenerationPreview,
  ProductCreatePreview,
  SuggestionApprovalPreview,
} from './catalog-actions.preview.js';
import { CategoryPreview, ItemSpecificsPreview } from './listing-setup.preview.js';
import { ListingUpdatePreview } from './listing-update.preview.js';
import { ProductReplacePreview } from './product-replace.preview.js';
import { ProductTextPreview } from './product-text.preview.js';
import { StockAdjustmentPreview } from './stock-adjustment.preview.js';
import { STORE_LISTING_PREVIEWS } from './store-listing.preview.js';

/** A plain-words preview for every write tool Agent Worker offers. */
export const ACTION_PREVIEW_FORMATTERS: readonly ActionPreviewFormatter[] = [
  new StockAdjustmentPreview(),
  new ProductTextPreview(),
  new ProductReplacePreview(),
  new ProductCreatePreview(),
  new ListingUpdatePreview(),
  ...STORE_LISTING_PREVIEWS,
  new CategoryPreview(),
  new ItemSpecificsPreview(),
  new ContentGenerationPreview(),
  new SuggestionApprovalPreview(),
];
