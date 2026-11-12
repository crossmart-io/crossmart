import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { FalabellaAction } from '../falabella.enums.js';
import {
  actionUrl,
  createFalabellaTestKit,
  expectFeed,
  sentParam,
  sentXml,
  xmlFixture,
} from '../falabella.fixtures.js';

describe('FalabellaInventorySync', () => {
  it('sets every SKU’s stock in the country in one feed, never below zero', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectFeed(http, FalabellaAction.ProductUpdate, 'product-update.xml');

    const failures = await connector.setQuantities(session, [
      { externalInventoryId: 'Test1', available: 40 },
      { externalInventoryId: 'Test2', available: -3 },
    ]);

    expect(failures).toEqual([]);
    expect(sentXml(http, 0)).toMatchObject({
      Request: {
        Product: [
          {
            SellerSku: 'Test1',
            BusinessUnits: { BusinessUnit: { OperatorCode: 'facl', Stock: '40' } },
          },
          {
            SellerSku: 'Test2',
            BusinessUnits: { BusinessUnit: { OperatorCode: 'facl', Stock: '0' } },
          },
        ],
      },
    });
    http.assertDone();
  });

  it('fails the batch when the feed fails without naming SKUs', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    expectFeed(http, FalabellaAction.ProductUpdate, 'product-update.xml', 'feed-status-errors.xml');

    await expect(
      connector.setQuantities(session, [{ externalInventoryId: 'Test1', available: 1 }]),
    ).rejects.toMatchObject({ code: ChannelErrorCode.RequestRejected });
  });

  it('sends nothing for an empty batch', async () => {
    const { connector, http, session } = createFalabellaTestKit();

    await expect(connector.setQuantities(session, [])).resolves.toEqual([]);
    expect(http.requests).toEqual([]);
  });

  it('reads stock in the connection’s country with GetProducts, which is not a feed', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    http.expect(HttpMethod.Get, actionUrl(FalabellaAction.GetProducts), xmlFixture('products.xml'));

    const quantities = await connector.readQuantities(session, [
      'test-seller-sku-001',
      'unknown-sku',
    ]);

    expect(quantities).toEqual(new Map([['test-seller-sku-001', 14]]));
    expect(sentParam(http, 0, 'Filter')).toBe('all');
    expect(sentParam(http, 0, 'SkuSellerList')).toBe('["test-seller-sku-001","unknown-sku"]');
  });
});
