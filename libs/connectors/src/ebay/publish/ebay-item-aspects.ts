import type {
  ListingDraft,
  ListingDraftVariant,
} from '../../sdk/capabilities/listing-publisher.js';
import type { CategoryAspect } from '../../sdk/capabilities/taxonomy-provider.js';
import { EBAY_BRAND_ASPECT, EBAY_UNBRANDED } from '../ebay.constants.js';
import type { EbayAspects } from './ebay-inventory.types.js';

/** eBay matches aspect names without regard to case; so does Crossmart when merging them. */
function aspectKey(name: string): string {
  return name.trim().toLowerCase();
}

function optionKeys(draft: ListingDraft): Set<string> {
  return new Set(draft.product.optionNames.map(aspectKey));
}

/**
 * The merchant's item specifics. Those named like one of the product's options are left out:
 * each variant's option value is its own aspect, and a group varies by it.
 */
function merchantAspects(draft: ListingDraft): EbayAspects {
  const options = optionKeys(draft);
  const aspects: EbayAspects = {};
  for (const { name, values } of draft.itemSpecifics ?? []) {
    if (values.length > 0 && !options.has(aspectKey(name))) aspects[name] = values;
  }
  return aspects;
}

/** The brand eBay shows: the merchant's Brand item specific, else the vendor. */
export function listingBrand(draft: ListingDraft): string | null {
  const brandKey = aspectKey(EBAY_BRAND_ASPECT);
  const chosen = draft.itemSpecifics?.find((specific) => aspectKey(specific.name) === brandKey);
  return chosen?.values[0] ?? (draft.product.vendor?.trim() || null);
}

/**
 * Aspects of the whole product: the vendor as its brand (or unbranded without one), then the
 * merchant's item specifics, which take precedence.
 */
export function productAspects(draft: ListingDraft): EbayAspects {
  const merchant = merchantAspects(draft);
  const brandKey = aspectKey(EBAY_BRAND_ASPECT);
  const hasBrand = Object.keys(merchant).some((name) => aspectKey(name) === brandKey);
  const defaults: EbayAspects = hasBrand
    ? {}
    : { [EBAY_BRAND_ASPECT]: [draft.product.vendor?.trim() || EBAY_UNBRANDED] };
  return { ...defaults, ...merchant };
}

/** The product's aspects plus the variant's option values, such as `Size: ["M"]`. */
export function variantAspects(draft: ListingDraft, variant: ListingDraftVariant): EbayAspects {
  const aspects = productAspects(draft);
  draft.product.optionNames.forEach((name, index) => {
    const value = variant.optionValues[index];
    if (value) aspects[name] = [value];
  });
  return aspects;
}

/** The category's required aspects the listing would be sent without, by eBay's names. */
export function missingRequiredAspects(
  draft: ListingDraft,
  aspects: readonly CategoryAspect[],
): string[] {
  const present = new Set([
    ...Object.keys(productAspects(draft)).map(aspectKey),
    ...optionKeys(draft),
  ]);
  return aspects
    .filter((aspect) => aspect.required && !present.has(aspectKey(aspect.name)))
    .map((aspect) => aspect.name);
}
