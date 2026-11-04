import type { ListingDraftVariant } from '../../sdk/capabilities/listing-publisher.js';
import {
  EBAY_DERIVED_KEY_PREFIX,
  EBAY_SKU_MAX_LENGTH,
  EBAY_SKU_PATTERN,
  UUID_SEPARATOR_PATTERN,
} from '../ebay.constants.js';

/** A stable eBay key from a Crossmart id: `CM` and the UUID's 32 hex digits. */
export function derivedKey(crossmartId: string): string {
  const compact = crossmartId.replace(UUID_SEPARATOR_PATTERN, '');
  return `${EBAY_DERIVED_KEY_PREFIX}${compact}`.slice(0, EBAY_SKU_MAX_LENGTH);
}

/** The inventory item group a multi-variant product is listed through. */
export function inventoryGroupKey(productId: string): string {
  return derivedKey(productId);
}

function skuCounts(variants: readonly ListingDraftVariant[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { sku } of variants) {
    if (sku) counts.set(sku, (counts.get(sku) ?? 0) + 1);
  }
  return counts;
}

/**
 * Each variant's eBay SKU, by variant id. A published variant keeps the SKU it was listed
 * with, so editing the catalog SKU never orphans the eBay item. Otherwise the merchant's SKU
 * is used when eBay accepts it (letters, digits, `-` and `_`, at most 50) and no other variant
 * of the product shares it; else one is derived from the variant id.
 */
export function assignSkus(variants: readonly ListingDraftVariant[]): Map<string, string> {
  const counts = skuCounts(variants);
  return new Map(
    variants.map((variant) => {
      const own = variant.sku;
      const usable = own !== null && EBAY_SKU_PATTERN.test(own) && counts.get(own) === 1;
      const sku = variant.externalVariantId ?? (usable ? own : derivedKey(variant.variantId));
      return [variant.variantId, sku];
    }),
  );
}
