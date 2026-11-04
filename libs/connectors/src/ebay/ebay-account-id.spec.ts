import { formatEbayAccountId, parseEbayAccountId } from './ebay-account-id.js';
import { EbayMarketplaceId } from './ebay-marketplace.js';

describe('eBay account ids', () => {
  it('formats and parses userId:marketplace', () => {
    const accountId = { userId: 'nY4uWx2bQ1e', marketplaceId: EbayMarketplaceId.Germany };

    expect(formatEbayAccountId(accountId)).toBe('nY4uWx2bQ1e:EBAY_DE');
    expect(parseEbayAccountId('nY4uWx2bQ1e:EBAY_DE')).toEqual(accountId);
  });

  it('splits on the last separator', () => {
    expect(parseEbayAccountId('odd:user:EBAY_US')).toEqual({
      userId: 'odd:user',
      marketplaceId: EbayMarketplaceId.UnitedStates,
    });
  });

  it.each(['', 'EBAY_US', ':EBAY_US', 'user:', 'user:EBAY_JP', 'demo.myshopify.com'])(
    'rejects %j',
    (value) => {
      expect(parseEbayAccountId(value)).toBeNull();
    },
  );
});
