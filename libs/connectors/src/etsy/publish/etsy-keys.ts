import type { ListingDraftVariant } from '../../sdk/capabilities/listing-publisher.js';
import { assignVariantKeys } from '../../sdk/listings/variant-keys.js';
import {
  ETSY_DERIVED_KEY_PREFIX,
  ETSY_INVENTORY_ID_SEPARATOR,
  ETSY_SKU_MAX_LENGTH,
  ETSY_SKU_PATTERN,
  UUID_SEPARATOR_PATTERN,
} from '../etsy.constants.js';

/** A stable Etsy SKU from a Crossmart id: `CM` and the UUID's first 30 hex digits. */
export function derivedSku(crossmartId: string): string {
  const compact = crossmartId.replace(UUID_SEPARATOR_PATTERN, '');
  return `${ETSY_DERIVED_KEY_PREFIX}${compact}`.slice(0, ETSY_SKU_MAX_LENGTH);
}

/**
 * Each variant's Etsy SKU, by variant id: the merchant's SKU when it fits (letters, digits,
 * `-` and `_`, at most 32) and is unique in the product, else one derived from the variant
 * id. A published variant keeps the SKU it was listed with.
 */
export function assignEtsySkus(variants: readonly ListingDraftVariant[]): Map<string, string> {
  return assignVariantKeys(variants, { accepts: ETSY_SKU_PATTERN, derive: derivedSku });
}

/** Where a variant's stock lives: its listing's inventory, under its SKU. */
export interface EtsyInventoryRef {
  listingId: string;
  sku: string;
}

/** `{listingId}:{sku}`, the listing variant's `externalInventoryId`. */
export function formatInventoryId({ listingId, sku }: EtsyInventoryRef): string {
  return `${listingId}${ETSY_INVENTORY_ID_SEPARATOR}${sku}`;
}

/** The parts of a stored `externalInventoryId`; null when it is not an Etsy one. */
export function parseInventoryId(externalInventoryId: string): EtsyInventoryRef | null {
  const separatorIndex = externalInventoryId.indexOf(ETSY_INVENTORY_ID_SEPARATOR);
  const listingId = externalInventoryId.slice(0, Math.max(separatorIndex, 0));
  const sku = externalInventoryId.slice(separatorIndex + 1);
  if (separatorIndex <= 0 || !/^\d+$/.test(listingId) || sku.length === 0) return null;
  return { listingId, sku };
}
