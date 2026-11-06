import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse, loadFixture } from '../../sdk/testing/fixtures.js';
import { ACCOUNT_ID, createEbayTestKit, FIXTURES } from '../ebay.fixtures.js';

const session = fakeChannelSession(ACCOUNT_ID);
const GB_SESSION = fakeChannelSession('nY4uWx2bQ1e:EBAY_GB');
const SINCE = new Date('2026-11-05T09:55:00Z');
const ORDERS_URL = 'https://api.sandbox.ebay.com/sell/fulfillment/v1/order';
const FILTER = 'lastmodifieddate%3A%5B2026-11-05T09%3A55%3A00.000Z..%5D';
const pageUrl = (offset: number) => `${ORDERS_URL}?filter=${FILTER}&limit=200&offset=${offset}`;
const BUYER_DETAILS = /fixture_buyer|Fixture Buyer|Example Street|example\.com|San Jose/;

describe('eBay orders', () => {
  it('reads orders modified since a time, 200 a page, with multi-unit and shipped lines', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Get, pageUrl(0), fixtureResponse(FIXTURES, 'orders-page-1.json'));

    const page = await connector.fetchOrders(session, SINCE, null);

    http.assertDone();
    expect(http.requests[0]?.headers?.authorization).toBe('Bearer test-access-token');
    expect(page.nextCursor).toBe('2');
    expect(page.items).toEqual([
      {
        externalId: '12-11111-00001',
        name: '12-11111-00001',
        placedAt: new Date('2026-11-05T10:02:11Z'),
        updatedAt: new Date('2026-11-05T10:04:37Z'),
        cancelled: false,
        currencyCode: 'USD',
        total: '24.00',
        lines: [
          {
            externalId: '10000000000001',
            externalVariantId: 'MUG-1',
            sku: 'MUG-1',
            title: 'Stoneware mug',
            quantity: 2,
            fulfilledQuantity: 0,
            unitPrice: '12.00',
          },
        ],
      },
      {
        externalId: '12-11111-00002',
        name: '12-11111-00002',
        placedAt: new Date('2026-11-05T10:20:00Z'),
        updatedAt: new Date('2026-11-05T11:45:09Z'),
        cancelled: false,
        currencyCode: 'USD',
        total: '68.50',
        lines: [
          {
            externalId: '10000000000002',
            externalVariantId: 'CM8c1e4a1b0b2c4d3e9f00112233445566',
            sku: 'CM8c1e4a1b0b2c4d3e9f00112233445566',
            title: 'Linen shirt',
            quantity: 1,
            fulfilledQuantity: 1,
            unitPrice: '40.00',
          },
          {
            externalId: '10000000000003',
            externalVariantId: null,
            sku: null,
            title: 'Tote bag listed outside Crossmart',
            quantity: 3,
            fulfilledQuantity: 0,
            unitPrice: '10.00',
          },
        ],
      },
    ]);
  });

  it('never carries buyer details past the HTTP layer', async () => {
    const { connector, http } = createEbayTestKit();
    expect(loadFixture(FIXTURES, 'orders-page-1.json')).toMatch(BUYER_DETAILS);
    http.expect(HttpMethod.Get, pageUrl(0), fixtureResponse(FIXTURES, 'orders-page-1.json'));

    const page = await connector.fetchOrders(session, SINCE, null);

    expect(JSON.stringify(page)).not.toMatch(BUYER_DETAILS);
  });

  it('reads the next page from its offset, and keeps only the connection’s marketplace', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Get, pageUrl(200), fixtureResponse(FIXTURES, 'orders-page-2.json'));

    const page = await connector.fetchOrders(session, SINCE, '200');

    expect(page.nextCursor).toBeNull();
    expect(page.items.map((order) => order.externalId)).toEqual(['12-11111-00003']);
    expect(page.items[0]).toMatchObject({ cancelled: true, total: '0.00' });
  });

  it('reads orders sold on its own marketplace only', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Get, pageUrl(200), fixtureResponse(FIXTURES, 'orders-page-2.json'));

    const page = await connector.fetchOrders(GB_SESSION, SINCE, '200');

    expect(page.items.map((order) => order.externalId)).toEqual(['03-11111-00004']);
    expect(page.items[0]).toMatchObject({ currencyCode: 'GBP', total: '10.00' });
  });

  it('reads one order, net of line refunds; a cancel request alone does not cancel it', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(
      HttpMethod.Get,
      `${ORDERS_URL}/12-11111-00005`,
      fixtureResponse(FIXTURES, 'order-partly-refunded.json'),
    );

    const order = await connector.fetchOrder(session, '12-11111-00005');

    expect(order).toMatchObject({
      cancelled: false,
      total: '24.00',
      lines: [{ quantity: 3, fulfilledQuantity: 3, unitPrice: '12.00' }],
    });
  });

  it('answers null for an order eBay does not have', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(
      HttpMethod.Get,
      `${ORDERS_URL}/12-99999-99999`,
      fixtureResponse(FIXTURES, 'order-not-found.json', 404),
    );

    await expect(connector.fetchOrder(session, '12-99999-99999')).resolves.toBeNull();
  });

  it('reports a rate limit for the poll to retry', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Get, pageUrl(0), jsonResponse({ errors: [] }, 429));

    await expect(connector.fetchOrders(session, SINCE, null)).rejects.toMatchObject({
      code: ChannelErrorCode.RateLimited,
    });
  });
});
