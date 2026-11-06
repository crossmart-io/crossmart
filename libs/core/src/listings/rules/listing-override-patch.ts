import type {
  ListingOverrideInput,
  ListingOverridePatch,
  VariantPriceOverrideInput,
} from '../entities/listing-override.js';

function setsAPrice(entry: VariantPriceOverrideInput): boolean {
  return entry.price !== null || entry.compareAtPrice !== null;
}

/** Each patched variant's prices replace its saved ones; both null reverts it to the rule. */
function mergeVariantPrices(
  current: readonly VariantPriceOverrideInput[],
  patched: readonly VariantPriceOverrideInput[] | undefined,
): VariantPriceOverrideInput[] {
  if (!patched) return [...current];
  const byVariant = new Map(current.map((entry) => [entry.variantId, entry]));
  for (const entry of patched) byVariant.set(entry.variantId, entry);
  return [...byVariant.values()].filter(setsAPrice);
}

/** One field after a patch: absent (undefined) keeps the current override, null reverts it. */
function patchedField<TKey extends keyof ListingOverrideInput>(
  current: ListingOverrideInput,
  patch: ListingOverridePatch,
  key: TKey,
): ListingOverrideInput[TKey] {
  const value = patch[key];
  return value === undefined ? current[key] : value;
}

/**
 * The overrides after a patch: absent fields keep their override, null ones follow the product
 * again, and variant prices merge per variant.
 */
export function applyOverridePatch(
  current: ListingOverrideInput,
  patch: ListingOverridePatch,
): ListingOverrideInput {
  return {
    title: patchedField(current, patch, 'title'),
    descriptionHtml: patchedField(current, patch, 'descriptionHtml'),
    vendor: patchedField(current, patch, 'vendor'),
    tags: patchedField(current, patch, 'tags'),
    mediaUrls: patchedField(current, patch, 'mediaUrls'),
    visibility: patchedField(current, patch, 'visibility'),
    inventoryBuffer: patchedField(current, patch, 'inventoryBuffer'),
    maxQuantity: patchedField(current, patch, 'maxQuantity'),
    variantPrices: mergeVariantPrices(current.variantPrices, patch.variantPrices),
  };
}
