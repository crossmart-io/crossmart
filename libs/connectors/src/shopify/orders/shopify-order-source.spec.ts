import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createShopifyTestKit, FIXTURES, GRAPHQL_URL, SHOP } from '../shopify.fixtures.js';
import { ShopifyScope } from '../shopify.constants.js';

const session = fakeChannelSession(SHOP, undefined, [ShopifyScope.ReadOrders]);
const SINCE = new Date('2026-11-04T07:55:00Z');

describe('Shopify orders', () => {
  it('reads orders changed since a time, with shipped units and no buyer data', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'orders-page.json'));

    const page = await connector.fetchOrders(session, SINCE, null);

    const { query, variables } = JSON.parse(http.requests[0]?.body ?? '{}');
    expect(variables).toEqual({
      first: 25,
      after: null,
      query: "updated_at:>='2026-11-04T07:55:00.000Z'",
    });
    expect(query).not.toMatch(/customer|email|shippingAddress|phone/);
    expect(page.nextCursor).toBe('cursor-1');
    expect(page.items).toEqual([
      {
        externalId: 'gid://shopify/Order/5001',
        name: '#1001',
        placedAt: new Date('2026-11-04T08:00:00Z'),
        updatedAt: new Date('2026-11-04T08:05:00Z'),
        cancelled: false,
        currencyCode: 'USD',
        total: '130.00',
        lines: [
          {
            externalId: 'gid://shopify/LineItem/6001',
            externalVariantId: 'gid://shopify/ProductVariant/8001',
            sku: 'SHIRT-S',
            title: 'Linen shirt - S',
            quantity: 2,
            fulfilledQuantity: 1,
            unitPrice: '45.00',
          },
          {
            externalId: 'gid://shopify/LineItem/6002',
            externalVariantId: null,
            sku: null,
            title: 'Gift wrap',
            quantity: 1,
            fulfilledQuantity: 0,
            unitPrice: '40.00',
          },
        ],
      },
    ]);
    http.assertDone();
  });

  it('reads one order by id, as a webhook names it', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'order-cancelled.json'));

    const order = await connector.fetchOrder(session, 'gid://shopify/Order/5001');

    expect(order).toMatchObject({ cancelled: true, total: '0.00', lines: [] });
  });

  it('reads nothing from stores that did not grant read_orders', async () => {
    const { connector, http } = createShopifyTestKit();

    const page = await connector.fetchOrders(fakeChannelSession(SHOP), SINCE, null);

    expect(page.items).toEqual([]);
    expect(
      await connector.fetchOrder(fakeChannelSession(SHOP), 'gid://shopify/Order/1'),
    ).toBeNull();
    expect(http.requests).toHaveLength(0);
  });
});
