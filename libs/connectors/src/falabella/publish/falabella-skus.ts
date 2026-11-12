import type { ListingDraftVariant } from '../../sdk/capabilities/listing-publisher.js';
import { assignVariantKeys } from '../../sdk/listings/variant-keys.js';
import {
  FALABELLA_DERIVED_SKU_PREFIX,
  FALABELLA_SKU_MAX_LENGTH,
  FALABELLA_SKU_PATTERN,
  UUID_SEPARATOR_PATTERN,
} from '../falabella.constants.js';

/** A stable seller SKU from a Crossmart id: `CM` and the UUID's hex digits. */
export function derivedFalabellaSku(crossmartId: string): string {
  const compact = crossmartId.replace(UUID_SEPARATOR_PATTERN, '');
  return `${FALABELLA_DERIVED_SKU_PREFIX}${compact}`.slice(0, FALABELLA_SKU_MAX_LENGTH);
}

/**
 * Each variant's seller SKU, by variant id: the merchant's SKU when Falabella takes it and no
 * other variant shares it, else one derived from the variant id. A listed variant keeps its SKU,
 * since Falabella keys every product by it.
 */
export function assignFalabellaSkus(variants: readonly ListingDraftVariant[]): Map<string, string> {
  return assignVariantKeys(variants, {
    accepts: FALABELLA_SKU_PATTERN,
    derive: derivedFalabellaSku,
  });
}
