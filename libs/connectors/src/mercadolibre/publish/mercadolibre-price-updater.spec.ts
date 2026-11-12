import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import {
  createMercadoLibreTestKit,
  FIXTURES,
  itemUrl,
  mercadoLibreSession,
  mercadoLibreSettings,
} from '../mercadolibre.fixtures.js';
import { MercadoLibreSiteId } from '../mercadolibre-site.js';

const VARIATIONS_ITEM = 'MLA657381404';
const SINGLE_ITEM = 'MLM2061397137';

function sentBodies(requests: { method: string; url: string; body?: string }[], url: string) {
  return requests
    .filter((request) => request.method === HttpMethod.Put && request.url === url)
    .map((request) => JSON.parse(request.body ?? '{}') as unknown);
}

describe('MercadoLibrePriceUpdater', () => {
  it('prices an item, and every variation of an item at one price', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    http
      .expect(
        HttpMethod.Put,
        itemUrl(SINGLE_ITEM),
        fixtureResponse(FIXTURES, 'user-product-item.json'),
      )
      .expect(
        HttpMethod.Get,
        itemUrl(VARIATIONS_ITEM),
        fixtureResponse(FIXTURES, 'item-with-variations.json'),
      )
      .expect(
        HttpMethod.Put,
        itemUrl(VARIATIONS_ITEM),
        fixtureResponse(FIXTURES, 'item-with-variations.json'),
      );

    await connector.updatePrices(mercadoLibreSession(), [
      {
        externalProductId: SINGLE_ITEM,
        externalVariantId: SINGLE_ITEM,
        price: '19800.456',
        compareAtPrice: null,
      },
      {
        externalProductId: VARIATIONS_ITEM,
        externalVariantId: `${VARIATIONS_ITEM}:14979332589`,
        price: '110.00',
        compareAtPrice: null,
      },
      {
        externalProductId: VARIATIONS_ITEM,
        externalVariantId: `${VARIATIONS_ITEM}:14979332592`,
        price: '120.00',
        compareAtPrice: null,
      },
    ]);

    expect(sentBodies(http.requests, itemUrl(SINGLE_ITEM))).toEqual([{ price: 19800.46 }]);
    expect(sentBodies(http.requests, itemUrl(VARIATIONS_ITEM))).toEqual([
      {
        variations: [
          { id: 14979332589, price: 120 },
          { id: 14979332592, price: 120 },
        ],
      },
    ]);
    http.assertDone();
  });

  it('prices in whole pesos where the currency has no decimals', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    const chile = mercadoLibreSession(
      mercadoLibreSettings({ siteId: MercadoLibreSiteId.Chile, currencyCode: 'CLP' }),
    );
    http.expect(
      HttpMethod.Put,
      itemUrl(SINGLE_ITEM),
      fixtureResponse(FIXTURES, 'user-product-item.json'),
    );

    await connector.updatePrices(chile, [
      {
        externalProductId: SINGLE_ITEM,
        externalVariantId: SINGLE_ITEM,
        price: '12990.50',
        compareAtPrice: null,
      },
    ]);

    expect(sentBodies(http.requests, itemUrl(SINGLE_ITEM))).toEqual([{ price: 12991 }]);
  });
});
