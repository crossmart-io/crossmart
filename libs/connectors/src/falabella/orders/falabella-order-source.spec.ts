import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { FalabellaAction } from '../falabella.enums.js';
import { actionUrl, createFalabellaTestKit, sentParam, xmlFixture } from '../falabella.fixtures.js';
import { sellerCenterDate } from './falabella-dates.js';

describe('FalabellaOrderSource', () => {
  it('reads a page of seller-shipped orders with their items, oldest change first', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    http
      .expect(HttpMethod.Get, actionUrl(FalabellaAction.GetOrders), xmlFixture('orders.xml'))
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetMultipleOrderItems),
        xmlFixture('multiple-order-items-page.xml'),
      );

    const page = await connector.fetchOrders(session, new Date('2025-04-03T00:00:00Z'), null);

    expect(sentParam(http, 0, 'UpdatedAfter')).toBe('2025-04-03T00:00:00+00:00');
    expect(sentParam(http, 0, 'SortBy')).toBe('updatedat');
    expect(sentParam(http, 0, 'SortDirection')).toBe('ASC');
    expect(sentParam(http, 0, 'ShippingType')).toBe('dropshipping');
    expect(sentParam(http, 0, 'Offset')).toBe('0');
    expect(sentParam(http, 1, 'OrderIdList')).toBe('[1104089001,1104089002]');
    expect(page.nextCursor).toBeNull();
    expect(page.totalCount).toBe(2);
    expect(page.items[0]).toEqual({
      externalId: '1104089001',
      name: '2771009001',
      placedAt: new Date('2025-04-03T15:00:00Z'),
      updatedAt: new Date('2025-04-03T17:00:00Z'),
      cancelled: false,
      currencyCode: 'CLP',
      total: '69990.00',
      lines: [
        {
          externalId: '126930387',
          externalVariantId: 'test1',
          sku: 'test1',
          title: 'Zapatillas',
          quantity: 1,
          fulfilledQuantity: 0,
          unitPrice: '69990.00',
        },
      ],
    });
    http.assertDone();
  });

  it('reads one order and its items, and says when Falabella has none', async () => {
    const { connector, http, session } = createFalabellaTestKit();
    http
      .expect(HttpMethod.Get, actionUrl(FalabellaAction.GetOrder), xmlFixture('order.xml'))
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetOrderItems),
        xmlFixture('order-items.xml'),
      )
      .expect(
        HttpMethod.Get,
        actionUrl(FalabellaAction.GetOrder),
        xmlFixture('products-empty.xml'),
      );

    const order = await connector.fetchOrder(session, '1104901123');
    const missing = await connector.fetchOrder(session, '1');

    expect(sentParam(http, 0, 'OrderId')).toBe('1104901123');
    expect(order).toMatchObject({
      externalId: '1104901123',
      name: '2777001234',
      currencyCode: 'PEN',
    });
    expect(order?.lines.length).toBeGreaterThan(0);
    expect(missing).toBeNull();
    http.assertDone();
  });
});

describe('sellerCenterDate', () => {
  it('reads Seller Center times in the country’s zone, and ISO times as they are', () => {
    expect(sellerCenterDate('2025-04-03 12:00:00', 'America/Santiago')).toEqual(
      new Date('2025-04-03T15:00:00Z'),
    );
    expect(sellerCenterDate('2025-07-03 12:00:00', 'America/Santiago')).toEqual(
      new Date('2025-07-03T16:00:00Z'),
    );
    expect(sellerCenterDate('2025-04-03 12:00:00', 'America/Lima')).toEqual(
      new Date('2025-04-03T17:00:00Z'),
    );
    expect(sellerCenterDate('2025-04-03T21:39:12.979Z', 'America/Lima')).toEqual(
      new Date('2025-04-03T21:39:12.979Z'),
    );
  });
});
