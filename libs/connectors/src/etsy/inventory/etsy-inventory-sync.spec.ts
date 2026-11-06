import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createEtsyTestKit, FIXTURES, INVENTORY_URL, LISTING_ID } from '../etsy.fixtures.js';

const OTHER_INVENTORY_URL = 'https://api.etsy.com/v3/application/listings/1809999999/inventory';

describe('EtsyInventorySync', () => {
  it('reads each listing’s inventory, sets the quantities and writes it all back', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http
      .expect(HttpMethod.Get, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'))
      .expect(HttpMethod.Put, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'));

    const failures = await connector.setQuantities(session, [
      { externalInventoryId: `${LISTING_ID}:MUG-S`, available: 9 },
      { externalInventoryId: `${LISTING_ID}:MUG-L`, available: -2 },
      { externalInventoryId: `${LISTING_ID}:MUG-XL`, available: 1 },
      { externalInventoryId: 'MUG-S', available: 1 },
    ]);

    expect(JSON.parse(http.requests[1]?.body ?? '')).toEqual({
      products: [
        {
          sku: 'MUG-S',
          property_values: [
            { property_id: 513, property_name: 'Size', value_ids: [1234567001], values: ['Small'] },
          ],
          offerings: [
            { price: 28, quantity: 9, is_enabled: true, readiness_state_id: 18201076875 },
          ],
        },
        {
          sku: 'MUG-L',
          property_values: [
            { property_id: 513, property_name: 'Size', value_ids: [1234567002], values: ['Large'] },
          ],
          offerings: [
            { price: 32, quantity: 0, is_enabled: true, readiness_state_id: 18201076875 },
          ],
        },
      ],
      price_on_property: [513],
      quantity_on_property: [513],
      sku_on_property: [513],
      readiness_state_on_property: [],
    });
    expect(failures).toEqual([
      { externalInventoryId: 'MUG-S', message: 'This is not an Etsy listing variant' },
      {
        externalInventoryId: `${LISTING_ID}:MUG-XL`,
        message: expect.stringContaining('no variant with this SKU'),
      },
    ]);
    http.assertDone();
  });

  it('writes nothing when Etsy shows the quantities already, as after an Etsy sale', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http.expect(HttpMethod.Get, INVENTORY_URL, fixtureResponse(FIXTURES, 'listing-inventory.json'));

    const failures = await connector.setQuantities(session, [
      { externalInventoryId: `${LISTING_ID}:MUG-S`, available: 4 },
      { externalInventoryId: `${LISTING_ID}:MUG-L`, available: 3 },
    ]);

    expect(failures).toEqual([]);
    expect(http.requests).toHaveLength(1);
  });

  it('fails a listing Etsy refuses with its reason, and rethrows outages', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http
      .expect(
        HttpMethod.Get,
        OTHER_INVENTORY_URL,
        jsonResponse({ error: 'Listing is not editable' }, 409),
      )
      .expect(HttpMethod.Get, INVENTORY_URL, jsonResponse({ error: 'down' }, 503));

    const refused = await connector.setQuantities(session, [
      { externalInventoryId: '1809999999:MUG-S', available: 1 },
    ]);

    expect(refused).toEqual([
      {
        externalInventoryId: '1809999999:MUG-S',
        message: 'Etsy rejected the request: Listing is not editable: 1809999999',
      },
    ]);
    await expect(
      connector.setQuantities(session, [
        { externalInventoryId: `${LISTING_ID}:MUG-S`, available: 1 },
      ]),
    ).rejects.toMatchObject({ code: ChannelErrorCode.ChannelUnavailable });
    await expect(connector.setQuantities(session, [])).resolves.toEqual([]);
  });
});
