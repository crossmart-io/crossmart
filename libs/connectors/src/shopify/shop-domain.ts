import {
  HTTPS_SCHEME,
  SHOP_DOMAIN_MAX_LENGTH,
  SHOP_DOMAIN_PATTERN,
  SHOP_DOMAIN_SUFFIX,
  SHOP_HANDLE_PATTERN,
} from './shopify.constants.js';

const URL_SCHEME_PATTERN = /^https?:\/\//i;
const PATH_START = '/';

/** True for a bare `*.myshopify.com` domain, the only form Shopify sends and Crossmart stores. */
export function isShopDomain(value: string): boolean {
  return value.length <= SHOP_DOMAIN_MAX_LENGTH && SHOP_DOMAIN_PATTERN.test(value);
}

/**
 * What a merchant typed (`my-store`, `my-store.myshopify.com`, or an admin URL) as a lower-case
 * `my-store.myshopify.com` domain, or null when it names no Shopify store. Custom domains are
 * not accepted: only the myshopify domain identifies a store for OAuth.
 */
export function normalizeShopDomain(input: string): string | null {
  const host = input.trim().replace(URL_SCHEME_PATTERN, '').split(PATH_START)[0].toLowerCase();
  const domain = SHOP_HANDLE_PATTERN.test(host) ? `${host}${SHOP_DOMAIN_SUFFIX}` : host;
  return isShopDomain(domain) ? domain : null;
}

export function shopOrigin(shopDomain: string): string {
  return `${HTTPS_SCHEME}${shopDomain}`;
}
