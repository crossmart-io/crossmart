import {
  type ChannelSettings,
  isEbaySettings,
  isGoogleMerchantSettings,
  isShopifySettings,
} from '@crossmart/connectors';
import { DEFAULT_CURRENCY_CODE } from '../../channels/channels.constants.js';
import type { ConnectionSettings } from '../../channels/entities/connection-settings.js';

/** The currency of the account as its connector read it, for channels that report one. */
function accountCurrency(account: ChannelSettings): string | null {
  if (isShopifySettings(account) || isEbaySettings(account) || isGoogleMerchantSettings(account)) {
    return account.currencyCode;
  }
  return null;
}

/**
 * The currency the channel account sells in: the Shopify store's currency, the eBay
 * marketplace's, or that of the country Google listings target. Falls back to the default before the account has been read.
 */
export function connectionCurrency(settings: ConnectionSettings): string {
  const { account } = settings;
  return (account && accountCurrency(account)) ?? DEFAULT_CURRENCY_CODE;
}
