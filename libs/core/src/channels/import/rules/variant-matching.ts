import type { ExternalVariant } from '@crossmart/connectors';
import type { ListingVariantMapping } from '../../repositories/listing.repository.js';
import type { CatalogVariantRef, VariantMatchResult } from '../entities/channel-import.js';

const OPTION_KEY_SEPARATOR = '\u0000';

function optionKey(values: string[]): string {
  return values.map((value) => value.trim().toLowerCase()).join(OPTION_KEY_SEPARATOR);
}

/** Catalog variants not mapped yet, indexed the ways a channel variant can match them. */
class VariantPool {
  private readonly free: Map<string, CatalogVariantRef>;

  constructor(variants: CatalogVariantRef[]) {
    this.free = new Map(variants.map((variant) => [variant.id, variant]));
  }

  get size(): number {
    return this.free.size;
  }

  take(variantId: string | undefined): CatalogVariantRef | undefined {
    const variant = variantId === undefined ? undefined : this.free.get(variantId);
    if (variant) this.free.delete(variant.id);
    return variant;
  }

  findBySku(sku: string | null): string | undefined {
    return sku ? this.find((variant) => variant.sku === sku) : undefined;
  }

  findByOptions(optionValues: string[]): string | undefined {
    const key = optionKey(optionValues);
    return this.find((variant) => optionKey(variant.optionValues) === key);
  }

  only(): string | undefined {
    return this.size === 1 ? [...this.free.keys()][0] : undefined;
  }

  private find(predicate: (variant: CatalogVariantRef) => boolean): string | undefined {
    return [...this.free.values()].find(predicate)?.id;
  }
}

function toMapping(external: ExternalVariant, variantId: string): ListingVariantMapping {
  return {
    variantId,
    externalId: external.externalId,
    externalInventoryId: external.externalInventoryId,
  };
}

type VariantMatcher = (external: ExternalVariant) => string | undefined;

/** Takes the catalog variant each matcher names, and returns the channel variants left over. */
function applyMatcher(
  pending: ExternalVariant[],
  pool: VariantPool,
  matcher: VariantMatcher,
  mappings: ListingVariantMapping[],
): ExternalVariant[] {
  return pending.filter((external) => {
    const variant = pool.take(matcher(external));
    if (variant) mappings.push(toMapping(external, variant.id));
    return !variant;
  });
}

/**
 * Maps a channel product's variants to the catalog product's, each catalog variant at most
 * once: first the mappings the listing already holds, then equal SKUs, then equal option
 * values, and finally a lone variant on both sides (a product without options).
 */
export function matchVariants(
  externalVariants: ExternalVariant[],
  catalogVariants: CatalogVariantRef[],
  knownVariants: ReadonlyMap<string, string> = new Map(),
): VariantMatchResult {
  const pool = new VariantPool(catalogVariants);
  const mappings: ListingVariantMapping[] = [];
  const matchers: VariantMatcher[] = [
    (external) => knownVariants.get(external.externalId),
    (external) => pool.findBySku(external.sku),
    (external) => pool.findByOptions(external.optionValues),
  ];
  let unmatched = externalVariants;
  for (const matcher of matchers) {
    unmatched = applyMatcher(unmatched, pool, matcher, mappings);
  }
  if (unmatched.length === 1) {
    unmatched = applyMatcher(unmatched, pool, () => pool.only(), mappings);
  }
  const order = new Map(externalVariants.map((external, index) => [external.externalId, index]));
  mappings.sort(
    (left, right) => (order.get(left.externalId) ?? 0) - (order.get(right.externalId) ?? 0),
  );
  return { mappings, unmatched };
}
