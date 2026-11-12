import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import {
  API,
  createMercadoLibreTestKit,
  FIXTURES,
  fixtureJson,
  mercadoLibreSession,
  USER_ID,
} from '../mercadolibre.fixtures.js';

const SINCE = new Date('2026-11-01T10:30:00Z');

describe('MercadoLibreOrderSource', () => {
  it('searches the seller’s orders updated since a time, a page at a time', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    http.expect(
      HttpMethod.Get,
      /\/orders\/search\?/,
      fixtureResponse(FIXTURES, 'orders-search.json'),
    );

    const page = await connector.fetchOrders(mercadoLibreSession(), SINCE, null);

    const url = new URL(http.requests[0]?.url ?? '');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      seller: USER_ID,
      'order.date_last_updated.from': '2026-11-01T10:30:00.000-00:00',
      sort: 'date_asc',
      limit: '50',
      offset: '0',
    });
    expect(page).toEqual({
      items: [
        {
          externalId: '2032217210',
          name: '#2032217210',
          placedAt: new Date('2019-05-22T03:51:05.000-04:00'),
          updatedAt: new Date('2020-02-14T02:55:49.811Z'),
          cancelled: false,
          currencyCode: 'BRL',
          total: '129.95',
          lines: [
            {
              externalId: 'MLB1054990648',
              externalVariantId: 'MLB1054990648',
              sku: null,
              title: 'Kit Com 03 Adesivo Spray 3m 75 Cola Silk Sublimação 300g',
              quantity: 1,
              fulfilledQuantity: 1,
              unitPrice: '129.95',
            },
          ],
        },
      ],
      nextCursor: null,
      totalCount: 1,
    });
  });

  it('reads one order, keying a variation’s line like its listing variant', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    const order = fixtureJson<{ order_items: { item: Record<string, unknown> }[] }>('order.json');
    order.order_items[0]!.item.variation_id = 14979332589;
    http
      .expect(
        HttpMethod.Get,
        `${API}/orders/2000003508419013`,
        jsonResponse({ ...order, status: 'cancelled' }),
      )
      .expect(
        HttpMethod.Get,
        `${API}/orders/404`,
        jsonResponse(
          { message: 'Order not found', error: 'order_not_found', status: 404, cause: [] },
          404,
        ),
      );

    const found = await connector.fetchOrder(mercadoLibreSession(), '2000003508419013');

    expect(found).toMatchObject({
      externalId: '2000003508419013',
      cancelled: true,
      total: '499.00',
      lines: [{ externalVariantId: 'MLB12345678:14979332589', quantity: 1, fulfilledQuantity: 0 }],
    });
    await expect(connector.fetchOrder(mercadoLibreSession(), '404')).resolves.toBeNull();
  });
});
