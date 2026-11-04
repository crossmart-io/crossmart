import { EBAY_ACCOUNT_ID_SEPARATOR } from './ebay.constants.js';
import { type EbayMarketplaceId, isEbayMarketplaceId } from './ebay-marketplace.js';

/** One eBay account on one marketplace: what a connection's `externalAccountId` names. */
export interface EbayAccountId {
  userId: string;
  marketplaceId: EbayMarketplaceId;
}

/** `{userId}:{marketplaceId}`, so one eBay account can connect each site separately. */
export function formatEbayAccountId({ userId, marketplaceId }: EbayAccountId): string {
  return `${userId}${EBAY_ACCOUNT_ID_SEPARATOR}${marketplaceId}`;
}

/** The parts of a stored `externalAccountId`, or null when it is not an eBay account id. */
export function parseEbayAccountId(externalAccountId: string): EbayAccountId | null {
  const separatorIndex = externalAccountId.lastIndexOf(EBAY_ACCOUNT_ID_SEPARATOR);
  const userId = externalAccountId.slice(0, Math.max(separatorIndex, 0));
  const marketplaceId = externalAccountId.slice(separatorIndex + 1);
  if (separatorIndex < 0 || userId.length === 0 || !isEbayMarketplaceId(marketplaceId)) {
    return null;
  }
  return { userId, marketplaceId };
}
