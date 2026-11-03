import { FakeOAuthConnector } from '../testing/fake-oauth-connector.js';
import { parseConnectionSettings } from './connection-settings.js';

const connector = new FakeOAuthConnector();
const PRODUCT_ID = '3f1c2b7a-9e8d-4c6b-a5f4-e3d2c1b0a9f8';

describe('parseConnectionSettings', () => {
  it('reads empty settings as nothing chosen yet', () => {
    expect(parseConnectionSettings(connector, {})).toEqual({
      account: null,
      productSelection: null,
    });
  });

  it('validates the account through the connector and the product selection rule', () => {
    const selection = {
      filter: { status: 'ACTIVE', tags: ['summer'], vendor: 'Acme' },
      includeProductIds: [PRODUCT_ID],
      excludeProductIds: [],
    };

    expect(
      parseConnectionSettings(connector, {
        account: { channel: 'shopify' },
        productSelection: selection,
      }),
    ).toEqual({
      account: { channel: 'shopify' },
      productSelection: selection,
    });
  });

  it('rejects unknown filter fields, bad ids and foreign account settings', () => {
    const rule = (filter: object, ids: string[] = []) => ({
      productSelection: { filter, includeProductIds: ids, excludeProductIds: [] },
    });

    expect(() => parseConnectionSettings(connector, rule({ price: 1 }))).toThrow(/price/);
    expect(() => parseConnectionSettings(connector, rule({}, ['not-a-uuid']))).toThrow(/UUID/i);
    expect(() => parseConnectionSettings(connector, rule({ status: 'GONE' }))).toThrow(/status/);
    expect(() => parseConnectionSettings(connector, { account: { channel: 'ebay' } })).toThrow(
      'Invalid settings',
    );
  });
});
