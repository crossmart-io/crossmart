import {
  EBAY_MARKETPLACES,
  EbayMarketplaceId,
  isEbayMarketplaceId,
  normalizeMarketplaceId,
} from './ebay-marketplace.js';

describe('normalizeMarketplaceId', () => {
  it('accepts supported marketplaces in any case', () => {
    expect(normalizeMarketplaceId('EBAY_US')).toBe(EbayMarketplaceId.UnitedStates);
    expect(normalizeMarketplaceId(' ebay_de ')).toBe(EbayMarketplaceId.Germany);
  });

  it.each(['', 'EBAY_JP', 'US', 'EBAY_US:1', 'demo-store.myshopify.com'])('rejects %j', (input) => {
    expect(normalizeMarketplaceId(input)).toBeNull();
  });
});

describe('EBAY_MARKETPLACES', () => {
  it('names a currency, a site and a language for every marketplace', () => {
    for (const marketplaceId of Object.values(EbayMarketplaceId)) {
      expect(isEbayMarketplaceId(marketplaceId)).toBe(true);
      expect(EBAY_MARKETPLACES[marketplaceId].currencyCode).toMatch(/^[A-Z]{3}$/);
      expect(EBAY_MARKETPLACES[marketplaceId].siteLabel).toMatch(/^eBay /);
      expect(EBAY_MARKETPLACES[marketplaceId].contentLanguage).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(EBAY_MARKETPLACES[marketplaceId].siteHost).toMatch(/^www\.ebay\./);
    }
    expect(EBAY_MARKETPLACES[EbayMarketplaceId.UnitedKingdom].currencyCode).toBe('GBP');
  });
});
