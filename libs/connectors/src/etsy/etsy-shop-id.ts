import { ETSY_SHOP_NAME_PATTERN } from './etsy.constants.js';

const SHOP_ID_PATTERN = /^[1-9]\d*$/;

/** A connection's `externalAccountId` is the Etsy shop id, such as `12345678`. */
export function isEtsyShopId(externalAccountId: string): boolean {
  return SHOP_ID_PATTERN.test(externalAccountId);
}

/**
 * The account handle: the shop name the merchant typed, lower-cased (Etsy shop names are 4 to
 * 20 letters or digits, unique whatever their case), or null when it cannot be one.
 */
export function normalizeEtsyShopName(shopName: string): string | null {
  const trimmed = shopName.trim();
  return ETSY_SHOP_NAME_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null;
}
