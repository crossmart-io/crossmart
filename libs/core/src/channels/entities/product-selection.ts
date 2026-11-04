import { z } from 'zod';
import { ProductStatus } from '@crossmart/database';
import { CatalogGap } from '../../catalog/enums/catalog-gap.enum.js';
import {
  PRODUCT_SELECTION_MAX_IDS,
  PRODUCT_SELECTION_MAX_TAGS,
  PRODUCT_SELECTION_TEXT_MAX_LENGTH,
} from '../channels.constants.js';

const text = z.string().trim().min(1).max(PRODUCT_SELECTION_TEXT_MAX_LENGTH);
const productIds = z.array(z.uuid()).max(PRODUCT_SELECTION_MAX_IDS);

/** A saved-view-style filter over the catalog. Absent fields are not applied. */
export const productSelectionFilterSchema = z
  .object({
    search: text.optional(),
    status: z.enum(ProductStatus).optional(),
    gap: z.enum(CatalogGap).optional(),
    tags: z.array(text).max(PRODUCT_SELECTION_MAX_TAGS).optional(),
    vendor: text.optional(),
  })
  .strict();

/**
 * Which products a connection lists: those matching `filter`, plus `includeProductIds`, minus
 * `excludeProductIds`. A null filter matches nothing, so only the included products are listed.
 * Stored on the connection; the publish flow evaluates it.
 */
export const productSelectionRuleSchema = z
  .object({
    filter: productSelectionFilterSchema.nullable(),
    includeProductIds: productIds,
    excludeProductIds: productIds,
  })
  .strict();

export type ProductSelectionFilter = z.infer<typeof productSelectionFilterSchema>;
export type ProductSelectionRule = z.infer<typeof productSelectionRuleSchema>;
