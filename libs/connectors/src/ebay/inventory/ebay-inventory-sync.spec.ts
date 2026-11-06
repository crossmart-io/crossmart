import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { ACCOUNT_ID, createEbayTestKit, FIXTURES } from '../ebay.fixtures.js';
import { INVENTORY, offersUrl } from '../publish/ebay-listing.fixtures.js';

const session = fakeChannelSession(ACCOUNT_ID);
const BULK_URL = `${INVENTORY}/bulk_update_price_quantity`;

/** An offer for the SKU, published with `availableQuantity`, as `GET /offer?sku=` answers. */
function offerOf(sku: string, offerId: string, availableQuantity: number, status = 'PUBLISHED') {
  return jsonResponse({ total: 1, offers: [{ offerId, sku, status, availableQuantity }] });
}

function bulkBodies(requests: readonly HttpRequest[]): unknown[][] {
  return requests
    .filter((request) => request.method === HttpMethod.Post)
    .map((request) => (JSON.parse(request.body ?? '{}') as { requests: unknown[] }).requests);
}

describe('eBay stock sync', () => {
  it('sets the item and its live offer, skipping SKUs whose listing shows the quantity', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(HttpMethod.Get, offersUrl('SHIRT-S'), offerOf('SHIRT-S', '9000000001', 7))
      .expect(
        HttpMethod.Get,
        offersUrl('SHIRT-M'),
        fixtureResponse(FIXTURES, 'offer-not-found.json', 404),
      )
      .expect(HttpMethod.Get, offersUrl('SHIRT-L'), offerOf('SHIRT-L', '9000000003', 4))
      .expect(HttpMethod.Post, BULK_URL, fixtureResponse(FIXTURES, 'bulk-quantity-updated.json'));

    const failures = await connector.setQuantities(session, [
      { externalInventoryId: 'SHIRT-S', available: 5 },
      { externalInventoryId: 'SHIRT-M', available: -2 },
      { externalInventoryId: 'SHIRT-L', available: 4 },
    ]);

    http.assertDone();
    expect(failures).toEqual([]);
    expect(bulkBodies(http.requests)).toEqual([
      [
        {
          sku: 'SHIRT-S',
          shipToLocationAvailability: { quantity: 5 },
          offers: [{ offerId: '9000000001', availableQuantity: 5 }],
        },
        { sku: 'SHIRT-M', shipToLocationAvailability: { quantity: 0 } },
      ],
    ]);
  });

  it('sends nothing when every listing shows its quantity, as after an eBay sale', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Get, offersUrl('SHIRT-S'), offerOf('SHIRT-S', '9000000001', 6));

    await expect(
      connector.setQuantities(session, [{ externalInventoryId: 'SHIRT-S', available: 6 }]),
    ).resolves.toEqual([]);

    http.assertDone();
    expect(bulkBodies(http.requests)).toEqual([]);
  });

  it('sets only the item of an offer that is not live', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(
        HttpMethod.Get,
        offersUrl('SHIRT-S'),
        offerOf('SHIRT-S', '9000000001', 6, 'UNPUBLISHED'),
      )
      .expect(HttpMethod.Post, BULK_URL, fixtureResponse(FIXTURES, 'bulk-quantity-updated.json'));

    await connector.setQuantities(session, [{ externalInventoryId: 'SHIRT-S', available: 6 }]);

    expect(bulkBodies(http.requests)).toEqual([
      [{ sku: 'SHIRT-S', shipToLocationAvailability: { quantity: 6 } }],
    ]);
  });

  it('sends 25 SKUs per call', async () => {
    const { connector, http } = createEbayTestKit();
    const skus = Array.from({ length: 26 }, (_, index) => `SKU-${index}`);
    for (const sku of skus)
      http.expect(HttpMethod.Get, offersUrl(sku), offerOf(sku, `o-${sku}`, 0));
    http
      .expect(HttpMethod.Post, BULK_URL, jsonResponse({ responses: [] }))
      .expect(HttpMethod.Post, BULK_URL, jsonResponse({ responses: [] }));

    await connector.setQuantities(
      session,
      skus.map((sku) => ({ externalInventoryId: sku, available: 3 })),
    );

    http.assertDone();
    expect(connector.maxBatchSize).toBe(25);
    expect(bulkBodies(http.requests).map((batch) => batch.length)).toEqual([25, 1]);
  });

  it('reports each SKU eBay refuses with its reason, and applies the rest', async () => {
    const { connector, http } = createEbayTestKit();
    http
      .expect(HttpMethod.Get, offersUrl('SHIRT-S'), offerOf('SHIRT-S', '9000000001', 7))
      .expect(HttpMethod.Get, offersUrl('SHIRT-M'), offerOf('SHIRT-M', '9000000002', 7))
      .expect(HttpMethod.Post, BULK_URL, fixtureResponse(FIXTURES, 'bulk-quantity-partial.json'));

    const failures = await connector.setQuantities(session, [
      { externalInventoryId: 'SHIRT-S', available: 2 },
      { externalInventoryId: 'SHIRT-M', available: 2 },
    ]);

    expect(failures).toEqual([
      {
        externalInventoryId: 'SHIRT-M',
        message: 'eBay rejected the quantity: Invalid value for availableQuantity.',
      },
    ]);
  });

  it('throws a rate limit for the job to retry', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Get, offersUrl('SHIRT-S'), jsonResponse({ errors: [] }, 429));

    await expect(
      connector.setQuantities(session, [{ externalInventoryId: 'SHIRT-S', available: 1 }]),
    ).rejects.toMatchObject({ code: ChannelErrorCode.RateLimited });
  });
});
