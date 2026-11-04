import { isShopifySettings } from '@crossmart/connectors';
import { DEFAULT_CURRENCY_CODE } from '../../channels/channels.constants.js';
import type { ConnectionSettings } from '../../channels/entities/connection-settings.js';
import type { PricingContext } from '../entities/price-resolution.js';

/** The currency the channel account sells in, as its connector read it. */
export function connectionCurrency(settings: ConnectionSettings): string {
  const { account } = settings;
  return account && isShopifySettings(account) ? account.currencyCode : DEFAULT_CURRENCY_CODE;
}

export function pricingContextOf(settings: ConnectionSettings): PricingContext {
  return { rule: settings.pricing, currencyCode: connectionCurrency(settings) };
}
