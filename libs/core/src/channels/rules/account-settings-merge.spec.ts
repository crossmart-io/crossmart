import { mergeReconnectedAccount } from './account-settings-merge.js';

describe('mergeReconnectedAccount', () => {
  it('lets fields the connector read win and keeps the merchant choices it never reads', () => {
    const stored = { channel: 'ebay', currencyCode: 'USD', listingDefaults: { condition: 'NEW' } };
    const incoming = { channel: 'ebay', currencyCode: 'GBP' };

    expect(mergeReconnectedAccount(stored, incoming)).toEqual({
      channel: 'ebay',
      currencyCode: 'GBP',
      listingDefaults: { condition: 'NEW' },
    });
  });

  it('replaces an account of another channel', () => {
    const incoming = { channel: 'shopify', currencyCode: 'EUR' };

    expect(mergeReconnectedAccount({ channel: 'ebay', extra: 1 }, incoming)).toEqual(incoming);
  });

  it('takes the incoming account when none is stored', () => {
    expect(mergeReconnectedAccount(null, { channel: 'shopify' })).toEqual({ channel: 'shopify' });
    expect(mergeReconnectedAccount({ channel: 'shopify' }, undefined)).toBeNull();
  });
});
