import type { ListingDraftVariant } from '../capabilities/listing-publisher.js';

/** How a channel keys a listed variant: what it accepts, and a key derived when it does not. */
export interface VariantKeyRules {
  /** The merchant's SKU is used as the key when it matches. */
  accepts: RegExp;
  /** A stable key from the Crossmart variant id. */
  derive: (variantId: string) => string;
}

function skuCounts(variants: readonly ListingDraftVariant[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const { sku } of variants) {
    if (sku) counts.set(sku, (counts.get(sku) ?? 0) + 1);
  }
  return counts;
}

/**
 * Each variant's key on the channel (an eBay SKU, a Google offer id), by variant id. A
 * published variant keeps the key it was listed with, so editing the catalog SKU never orphans
 * the channel's item. Otherwise the merchant's SKU is used when the channel accepts it and no
 * other variant of the product shares it; else one is derived from the variant id.
 */
export function assignVariantKeys(
  variants: readonly ListingDraftVariant[],
  rules: VariantKeyRules,
): Map<string, string> {
  const counts = skuCounts(variants);
  return new Map(
    variants.map((variant) => {
      const own = variant.sku;
      const usable = own !== null && rules.accepts.test(own) && counts.get(own) === 1;
      const key = variant.externalVariantId ?? (usable ? own : rules.derive(variant.variantId));
      return [variant.variantId, key];
    }),
  );
}
