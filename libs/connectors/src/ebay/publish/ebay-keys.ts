import type { ListingDraftVariant } from '../../sdk/capabilities/listing-publisher.js';
import { assignVariantKeys } from '../../sdk/listings/variant-keys.js';
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

/**
 * Each variant's eBay SKU, by variant id: the merchant's SKU when eBay accepts it (letters,
 * digits, `-` and `_`, at most 50) and it is unique in the product, else one derived from the
 * variant id. A published variant keeps the SKU it was listed with.
 */
export function assignSkus(variants: readonly ListingDraftVariant[]): Map<string, string> {
  return assignVariantKeys(variants, { accepts: EBAY_SKU_PATTERN, derive: derivedKey });
}
