import type { MediaDraft, ProductDraft, VariantDraft } from '../../entities/product-draft.js';
import type { ProductUpdateTargetRecord } from '../../repositories/product.queries.js';

type ExistingVariant = ProductUpdateTargetRecord['variants'][number];

/**
 * Prepares a file's product to replace the catalog product with the same handle:
 * - variants keep their id when matched, first by SKU, then by identical option values;
 * - matched variants keep their stock, which only an inventory import changes;
 * - the catalog's images stay when the file lists none.
 */
export function mergeWithExisting(
  draft: ProductDraft,
  existing: ProductUpdateTargetRecord,
): ProductDraft {
  const matches = matchVariants(draft.variants, existing.variants);
  return {
    ...draft,
    variants: draft.variants.map((variant, index) => {
      const match = matches.get(index);
      return match ? keepIdentityAndStock(variant, match) : variant;
    }),
    media: draft.media.length > 0 ? draft.media : existing.media.map(toMediaDraft),
  };
}

/** The existing variant each file variant (by index) replaces. Each is used at most once. */
function matchVariants(
  variants: VariantDraft[],
  existing: ExistingVariant[],
): Map<number, ExistingVariant> {
  const unmatched = [...existing];
  const matches = new Map<number, ExistingVariant>();
  const take = (index: number, found: number): void => {
    const [match] = unmatched.splice(found, 1);
    if (match) matches.set(index, match);
  };
  variants.forEach((variant, index) => {
    if (!variant.sku) return;
    const found = unmatched.findIndex((candidate) => candidate.sku === variant.sku);
    if (found !== -1) take(index, found);
  });
  variants.forEach((variant, index) => {
    if (matches.has(index)) return;
    const found = unmatched.findIndex((candidate) =>
      sameOptions(candidate.optionValues, variant.optionValues),
    );
    if (found !== -1) take(index, found);
  });
  return matches;
}

function sameOptions(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function keepIdentityAndStock(variant: VariantDraft, match: ExistingVariant): VariantDraft {
  const stock = match.inventoryItem;
  return {
    ...variant,
    id: match.id,
    inventory: stock ? { tracked: stock.tracked, quantity: stock.available } : variant.inventory,
  };
}

function toMediaDraft(media: ProductUpdateTargetRecord['media'][number]): MediaDraft {
  return { url: media.url, altText: media.altText ?? undefined };
}
