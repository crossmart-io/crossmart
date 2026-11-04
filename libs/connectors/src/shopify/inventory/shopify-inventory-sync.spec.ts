import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import type { HttpRequest } from '../../sdk/http/http-transport.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { createShopifyTestKit, FIXTURES, GRAPHQL_URL, SHOP } from '../shopify.fixtures.js';

const session = fakeChannelSession(SHOP);
const LOCATION = 'gid://shopify/Location/1001';

interface SetBody {
  query: string;
  variables: {
    idempotencyKey: string;
    input: { name: string; reason: string; quantities: { inventoryItemId: string }[] };
  };
}

function bodyOf(request: HttpRequest | undefined): SetBody {
  return JSON.parse(request?.body ?? '{}') as SetBody;
}

function items(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    externalInventoryId: `gid://shopify/InventoryItem/${index}`,
    available: index,
  }));
}

describe('Shopify inventory sync', () => {
  it('sets absolute quantities at the primary location without a compare check', async () => {
    const { connector, http } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'inventory-set-quantities.json'),
      );

    const failures = await connector.setQuantities(session, [
      { externalInventoryId: 'gid://shopify/InventoryItem/1', available: 5 },
      { externalInventoryId: 'gid://shopify/InventoryItem/2', available: -3 },
    ]);

    const { query, variables } = bodyOf(http.requests[1]);
    expect(failures).toEqual([]);
    expect(query).toContain('@idempotent(key: $idempotencyKey)');
    expect(variables.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(variables.input).toEqual({
      name: 'available',
      reason: 'correction',
      quantities: [
        {
          inventoryItemId: 'gid://shopify/InventoryItem/1',
          locationId: LOCATION,
          quantity: 5,
          changeFromQuantity: null,
        },
        {
          inventoryItemId: 'gid://shopify/InventoryItem/2',
          locationId: LOCATION,
          quantity: 0,
          changeFromQuantity: null,
        },
      ],
    });
  });

  it('splits large updates into batches of 250 and reads the location once', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'));
    for (let batch = 0; batch < 3; batch += 1) {
      http.expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'inventory-set-quantities.json'),
      );
    }

    await connector.setQuantities(session, items(600));

    const sizes = http.requests
      .slice(1)
      .map((request) => bodyOf(request).variables.input.quantities.length);
    expect(connector.maxBatchSize).toBe(250);
    expect(sizes).toEqual([250, 250, 100]);
    http.assertDone();
  });

  it('reports the item a user error points at, and fails the batch for any other', async () => {
    const { connector, http } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        fixtureResponse(FIXTURES, 'inventory-set-quantities-partial.json'),
      )
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        jsonResponse({
          data: {
            inventorySetQuantities: {
              userErrors: [{ field: null, message: 'Location is inactive' }],
            },
          },
        }),
      );

    const partial = await connector.setQuantities(session, items(3));
    const whole = await connector.setQuantities(session, items(2));

    expect(partial).toEqual([
      {
        externalInventoryId: 'gid://shopify/InventoryItem/1',
        message: 'The specified inventory item is not stocked at the location.',
      },
    ]);
    expect(whole.map((failure) => failure.message)).toEqual([
      'Location is inactive',
      'Location is inactive',
    ]);
  });

  it('fails every item when the store has no location', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, jsonResponse({ data: { location: null } }));

    const failures = await connector.setQuantities(session, items(2));

    expect(failures).toHaveLength(2);
    expect(http.requests).toHaveLength(1);
  });

  it('reads available quantities at the primary location, leaving out unstocked items', async () => {
    const { connector, http } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'primary-location.json'))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'inventory-levels.json'));

    const quantities = await connector.readQuantities(session, [
      'gid://shopify/InventoryItem/1',
      'gid://shopify/InventoryItem/2',
      'gid://shopify/InventoryItem/3',
    ]);

    expect([...quantities]).toEqual([['gid://shopify/InventoryItem/1', 7]]);
    expect(JSON.parse(http.requests[1]?.body ?? '{}').variables).toEqual({
      ids: [
        'gid://shopify/InventoryItem/1',
        'gid://shopify/InventoryItem/2',
        'gid://shopify/InventoryItem/3',
      ],
      locationId: LOCATION,
    });
    http.assertDone();
  });
});
