import type { ChannelSession } from '../../sdk/auth/channel-session.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { parseEbayAccountId } from '../ebay-account-id.js';
import { ebayError } from '../ebay-errors.js';
import {
  EBAY_MARKETPLACES,
  type EbayMarketplace,
  type EbayMarketplaceId,
} from '../ebay-marketplace.js';

const NOT_AN_EBAY_ACCOUNT = 'This is not an eBay account';

/** Who a call acts for: the token, and the marketplace of the connection. */
export interface EbayAccountContext {
  accessToken: string;
  marketplaceId: EbayMarketplaceId;
  marketplace: EbayMarketplace;
}

/** The token and marketplace of a session on an eBay connection. */
export async function ebayAccountContext(session: ChannelSession): Promise<EbayAccountContext> {
  const accountId = parseEbayAccountId(session.externalAccountId);
  if (!accountId) {
    throw ebayError(ChannelErrorCode.InvalidAccount, NOT_AN_EBAY_ACCOUNT);
  }
  return {
    accessToken: await session.accessToken(),
    marketplaceId: accountId.marketplaceId,
    marketplace: EBAY_MARKETPLACES[accountId.marketplaceId],
  };
}
