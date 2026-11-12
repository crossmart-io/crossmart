import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import {
  createMercadoLibreTestKit,
  FIXTURES,
  fixtureJson,
  itemUrl,
  mercadoLibreSession,
} from '../mercadolibre.fixtures.js';

const VARIATIONS_ITEM = 'MLA657381404';
const SINGLE_ITEM = 'MLB1548991737';

function sentBodies(requests: { method: string; url: string; body?: string }[], url: string) {
  return requests
    .filter((request) => request.method === HttpMethod.Put && request.url === url)
    .map((request) => JSON.parse(request.body ?? '{}') as unknown);
}

describe('MercadoLibreInventorySync', () => {
  it('sets an item’s quantity, and a variation’s alongside every other variation', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    http
      .expect(HttpMethod.Put, itemUrl(SINGLE_ITEM), fixtureResponse(FIXTURES, 'item-created.json'))
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

    const failures = await connector.setQuantities(mercadoLibreSession(), [
      { externalInventoryId: SINGLE_ITEM, available: 6 },
      { externalInventoryId: `${VARIATIONS_ITEM}:14979332592`, available: -2 },
    ]);

    expect(failures).toEqual([]);
    expect(sentBodies(http.requests, itemUrl(SINGLE_ITEM))).toEqual([{ available_quantity: 6 }]);
    expect(sentBodies(http.requests, itemUrl(VARIATIONS_ITEM))).toEqual([
      { variations: [{ id: 14979332589 }, { id: 14979332592, available_quantity: 0 }] },
    ]);
    http.assertDone();
  });

  it('reports an item Mercado Libre refuses, and carries on with the others', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    const closed = { ...fixtureJson('item-with-variations.json'), status: 'closed' };
    http
      .expect(HttpMethod.Get, itemUrl(VARIATIONS_ITEM), jsonResponse(closed))
      .expect(HttpMethod.Put, itemUrl(SINGLE_ITEM), fixtureResponse(FIXTURES, 'item-created.json'));

    const failures = await connector.setQuantities(mercadoLibreSession(), [
      { externalInventoryId: `${VARIATIONS_ITEM}:14979332589`, available: 3 },
      { externalInventoryId: SINGLE_ITEM, available: 1 },
    ]);

    expect(failures).toEqual([
      {
        externalInventoryId: `${VARIATIONS_ITEM}:14979332589`,
        message: expect.stringContaining('closed or removed') as string,
      },
    ]);
    http.assertDone();
  });
});
