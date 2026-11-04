import { EbayEnvironment } from '@crossmart/common';
import { EBAY_ITEM_PATH, EBAY_SANDBOX_SITE_HOST, HTTPS_PROTOCOL } from '../ebay.constants.js';
import type { EbayMarketplace } from '../ebay-marketplace.js';

/** The listing's page: on the marketplace's site, or on the sandbox's single site. */
export function ebayListingUrl(
  listingId: string,
  marketplace: EbayMarketplace,
  environment: EbayEnvironment,
): string {
  const host =
    environment === EbayEnvironment.Sandbox ? EBAY_SANDBOX_SITE_HOST : marketplace.siteHost;
  return `${HTTPS_PROTOCOL}//${host}${EBAY_ITEM_PATH}${encodeURIComponent(listingId)}`;
}
