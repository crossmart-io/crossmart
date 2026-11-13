import { ChannelType, EbayMarketplaceId, MercadoLibreSiteId } from '@crossmart/connectors';
import { DEFAULT_CURRENCY_CODE } from '../../channels/channels.constants.js';
import { emptyConnectionSettings } from '../../channels/entities/connection-settings.js';
import { connectionCurrency } from './connection-currency.js';

describe('connectionCurrency', () => {
  it('is the Shopify store’s currency', () => {
    const account = {
      channel: ChannelType.Shopify,
      shopName: 'Demo',
      currencyCode: 'EUR',
      ianaTimezone: null,
      primaryDomainUrl: null,
      primaryLocation: null,
    };

    expect(connectionCurrency({ ...emptyConnectionSettings(), account })).toBe('EUR');
  });

  it('is the eBay marketplace’s currency', () => {
    const account = {
      channel: ChannelType.Ebay,
      marketplaceId: EbayMarketplaceId.UnitedKingdom,
      currencyCode: 'GBP',
      username: 'demo_seller',
      userId: 'user-1',
      businessPoliciesEnabled: false,
      policies: { fulfillment: [], payment: [], return: [] },
    };

    expect(connectionCurrency({ ...emptyConnectionSettings(), account })).toBe('GBP');
  });

  it('is the Mercado Libre site’s currency', () => {
    const account = {
      channel: ChannelType.MercadoLibre,
      userId: '1008002397',
      nickname: 'TESTSELLER',
      siteId: MercadoLibreSiteId.Chile,
      currencyCode: 'CLP',
      permalink: null,
      userProductSeller: true,
    };

    expect(connectionCurrency({ ...emptyConnectionSettings(), account })).toBe('CLP');
  });

  it('falls back to the default before the account is read, or for other channels', () => {
    expect(connectionCurrency(emptyConnectionSettings())).toBe(DEFAULT_CURRENCY_CODE);
    expect(
      connectionCurrency({ ...emptyConnectionSettings(), account: { channel: ChannelType.Etsy } }),
    ).toBe(DEFAULT_CURRENCY_CODE);
  });
});
