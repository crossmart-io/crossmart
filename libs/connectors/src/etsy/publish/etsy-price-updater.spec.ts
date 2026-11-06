import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createEtsyTestKit, FIXTURES, INVENTORY_URL, LISTING_ID } from '../etsy.fixtures.js';

describe('EtsyPriceUpdater', () => {
  it('sets each SKU’s offering price through the listing’s inventory', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http
      .expect(HttpMethod.Get, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'))
      .expect(HttpMethod.Put, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'));

    await connector.updatePrices(session, [
      {
        externalProductId: LISTING_ID,
        externalVariantId: 'MUG-L',
        price: '34.90',
        compareAtPrice: '40.00',
      },
    ]);

    const body = JSON.parse(http.requests[1]?.body ?? '') as {
      products: { offerings: { price: number }[] }[];
    };
    expect(body.products.map((product) => product.offerings[0]?.price)).toEqual([28, 34.9]);
    http.assertDone();
  });

  it('fails naming a SKU the listing does not have', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http.expect(HttpMethod.Get, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'));

    await expect(
      connector.updatePrices(session, [
        {
          externalProductId: LISTING_ID,
          externalVariantId: 'MUG-S',
          price: '28.00',
          compareAtPrice: null,
        },
        {
          externalProductId: LISTING_ID,
          externalVariantId: 'GONE',
          price: '1.00',
          compareAtPrice: null,
        },
      ]),
    ).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: expect.stringContaining('GONE'),
    });
    expect(http.requests).toHaveLength(1);
  });
});
