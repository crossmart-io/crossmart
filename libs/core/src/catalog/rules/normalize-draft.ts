import { sanitizeDescriptionHtml } from '@crossmart/common';
import type { ProductDraft } from '../entities/product-draft.js';

/** Applied to every draft before it is stored, whatever its source. */
export function normalizeDraft(draft: ProductDraft): ProductDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    descriptionHtml: sanitizeDescriptionHtml(draft.descriptionHtml),
    tags: [...new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))],
    optionNames: draft.optionNames.map((name) => name.trim()),
    variants: draft.variants.map((variant) => ({
      ...variant,
      sku: variant.sku?.trim() || undefined,
      barcode: variant.barcode?.trim() || undefined,
      optionValues: variant.optionValues.map((value) => value.trim()),
    })),
  };
}
