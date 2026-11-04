import type { ProductDraft, VariantDraft } from '../../entities/product-draft.js';
import type { ProductPatch, VariantPatch } from '../../entities/product-patch.js';
import { ProductDraftField } from '../../enums/product-draft-field.enum.js';

export interface ProductMerge {
  /** The catalog product with the file's changes, ready to validate and write. */
  draft: ProductDraft;
  /** Indexes of the file's variants that matched no catalog variant and were not added. */
  unmatchedVariants: number[];
}

/**
 * Applies an update file's product onto the catalog product with the same handle:
 * - product and variant fields change only where the file has the column (see `ProductPatch`);
 * - file variants are matched to catalog variants first by SKU, then by identical option
 *   values; a matched variant keeps its id and stock, which only an inventory import changes;
 * - catalog variants the file does not list stay as they are: an update never deletes one;
 * - a file variant that matches none is added when the file gives it a value for every
 *   option of the product. Without option values it could not be told apart from the
 *   variants already there, so it is reported instead;
 * - the catalog's images stay when the file lists none.
 */
export function mergeIntoExisting(existing: ProductDraft, patch: ProductPatch): ProductMerge {
  const product = patch.applyTo(existing);
  const matches = matchVariants(patch.variants, existing.variants);
  const variants = existing.variants.map((variant, index) => {
    const match = matches.get(index);
    return match ? match.applyTo(variant) : variant;
  });
  const matched = new Set(matches.values());
  const added: VariantDraft[] = [];
  const unmatchedVariants: number[] = [];
  patch.variants.forEach((variant, index) => {
    if (matched.has(variant)) return;
    if (canAddVariant(variant, product, patch)) {
      added.push(variant.values);
    } else {
      unmatchedVariants.push(index);
    }
  });
  return {
    draft: {
      ...product,
      variants: [...variants, ...added],
      media: patch.media.length > 0 ? patch.media : existing.media,
    },
    unmatchedVariants,
  };
}

/** The file variant applied to each catalog variant, by catalog index. Each is used at most once. */
function matchVariants(
  patches: VariantPatch[],
  existing: VariantDraft[],
): Map<number, VariantPatch> {
  const matches = new Map<number, VariantPatch>();
  const claim = (patch: VariantPatch, isMatch: (variant: VariantDraft) => boolean): void => {
    const found = existing.findIndex((variant, index) => !matches.has(index) && isMatch(variant));
    if (found !== -1) matches.set(found, patch);
  };
  const withSku = patches.filter((patch) => patch.values.sku !== undefined);
  withSku.forEach((patch) => claim(patch, (variant) => variant.sku === patch.values.sku));
  const claimed = new Set(matches.values());
  patches
    .filter((patch) => !claimed.has(patch))
    .forEach((patch) =>
      claim(patch, (variant) => sameOptions(variant.optionValues, patch.values.optionValues)),
    );
  return matches;
}

function sameOptions(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** A new variant needs the file's options and a non-empty value for each of the product's. */
function canAddVariant(variant: VariantPatch, product: ProductDraft, patch: ProductPatch): boolean {
  const { optionValues } = variant.values;
  return (
    patch.has(ProductDraftField.Options) &&
    product.optionNames.length > 0 &&
    optionValues.length === product.optionNames.length &&
    optionValues.every((value) => value.trim() !== '')
  );
}
