import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createEtsyTestKit, FIXTURES, RECEIPTS_URL } from '../etsy.fixtures.js';

const SINCE = new Date('2026-11-07T07:00:00Z');
const PAGE_URL = (offset: number): string =>
  `${RECEIPTS_URL}?min_last_modified=1794034800&sort_on=updated&sort_order=asc&limit=100&offset=${offset}`;

describe('EtsyOrderSource', () => {
  it('reads receipts changed since a time, oldest change first, page by page', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http
      .expect(HttpMethod.Get, PAGE_URL(0), fixtureResponse(FIXTURES, 'receipts-page-1.json'))
      .expect(HttpMethod.Get, PAGE_URL(2), fixtureResponse(FIXTURES, 'receipts-page-2.json'));

    const first = await connector.fetchOrders(session, SINCE, null);
    const second = await connector.fetchOrders(session, SINCE, first.nextCursor);

    expect(first.nextCursor).toBe('2');
    expect(first.totalCount).toBe(3);
    expect(second.nextCursor).toBeNull();
    expect(first.items[0]).toEqual({
      externalId: '3301001',
      name: '3301001',
      placedAt: new Date('2026-11-07T07:20:00.000Z'),
      updatedAt: new Date('2026-11-07T07:21:40.000Z'),
      cancelled: false,
      currencyCode: 'USD',
      total: '65.00',
      lines: [
        {
          externalId: '4401001',
          externalVariantId: 'MUG-S',
          sku: 'MUG-S',
          title: 'Speckled stoneware mug',
          quantity: 2,
          fulfilledQuantity: 0,
          unitPrice: '28.00',
        },
        {
          externalId: '4401002',
          externalVariantId: null,
          sku: null,
          title: 'Gift wrap ribbon',
          quantity: 1,
          fulfilledQuantity: 0,
          unitPrice: '4.00',
        },
      ],
    });
    expect(first.items[1]).toMatchObject({ total: '27.00', lines: [{ fulfilledQuantity: 1 }] });
    expect(second.items[0]).toMatchObject({ externalId: '3301003', cancelled: true });
  });

  it('never keeps buyer details', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http.expect(HttpMethod.Get, PAGE_URL(0), fixtureResponse(FIXTURES, 'receipts-page-1.json'));

    const page = await connector.fetchOrders(session, SINCE, null);

    const kept = JSON.stringify(page);
    for (const detail of [
      'Fixture Buyer',
      'fixture-buyer@example.com',
      'Fixture Street',
      '11211',
      'mother',
      '99887766',
    ]) {
      expect(kept).not.toContain(detail);
    }
  });

  it('reads one receipt, shipped as a whole, and null when Etsy has none', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http
      .expect(
        HttpMethod.Get,
        `${RECEIPTS_URL}/3301004`,
        fixtureResponse(FIXTURES, 'receipt-shipped.json'),
      )
      .expect(
        HttpMethod.Get,
        `${RECEIPTS_URL}/3309999`,
        fixtureResponse(FIXTURES, 'receipt-not-found.json', 404),
      )
      .expect(HttpMethod.Get, `${RECEIPTS_URL}/1`, jsonResponse({ error: 'rate' }, 429));

    const shipped = await connector.fetchOrder(session, '3301004');

    expect(shipped).toMatchObject({
      total: '69.00',
      lines: [{ quantity: 2, fulfilledQuantity: 2, unitPrice: '32.00' }],
    });
    await expect(connector.fetchOrder(session, '3309999')).resolves.toBeNull();
    await expect(connector.fetchOrder(session, '1')).rejects.toMatchObject({
      code: ChannelErrorCode.RateLimited,
    });
  });
});
