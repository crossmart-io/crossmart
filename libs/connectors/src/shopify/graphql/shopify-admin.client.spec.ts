import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fakeChannelSession } from '../../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { createShopifyTestKit, FIXTURES, GRAPHQL_URL, SHOP } from '../shopify.fixtures.js';
import { SHOP_QUERY } from './shop.query.js';

const session = fakeChannelSession(SHOP, 'shpat_session');

describe('ShopifyAdminClient', () => {
  it('sends the operation to the versioned endpoint with the access token header', async () => {
    const { admin, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'shop.json'));

    const data = await admin.request(session, SHOP_QUERY);

    expect(data.shop.name).toBe('Demo Store');
    expect(http.requests[0].headers?.['x-shopify-access-token']).toBe('shpat_session');
    expect(JSON.parse(http.requests[0].body ?? '')).toMatchObject({ variables: {} });
  });

  it('waits for the cost bucket to refill when throttled, then retries', async () => {
    const { admin, http, sleeper } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'throttled.json'))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'shop.json'));

    await admin.request(session, SHOP_QUERY);

    // 100 points short at 50 points per second.
    expect(sleeper.waits).toEqual([2000]);
    http.assertDone();
  });

  it('honours Retry-After on 429 and backs off on outages and network errors', async () => {
    const { admin, http, sleeper } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, jsonResponse('', 429, { 'retry-after': '3' }))
      .expect(HttpMethod.Post, GRAPHQL_URL, jsonResponse('', 502))
      .expect(HttpMethod.Post, GRAPHQL_URL, new Error('socket hang up'))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'shop.json'));

    await admin.request(session, SHOP_QUERY);

    expect(sleeper.waits).toEqual([3000, 1000, 2000]);
  });

  it('gives up after five attempts with a rate-limit error', async () => {
    const { admin, http, sleeper } = createShopifyTestKit();
    for (let attempt = 0; attempt < 5; attempt += 1) {
      http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'throttled.json'));
    }

    await expect(admin.request(session, SHOP_QUERY)).rejects.toMatchObject({
      code: ChannelErrorCode.RateLimited,
      retryable: true,
    });
    expect(sleeper.waits).toHaveLength(4);
  });

  it('does not retry rejected tokens, GraphQL errors or unexpected payloads', async () => {
    const { admin, http, sleeper } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, jsonResponse('', 401))
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'graphql-error.json'))
      .expect(HttpMethod.Post, GRAPHQL_URL, jsonResponse({ data: { shop: null } }))
      .expect(HttpMethod.Post, GRAPHQL_URL, jsonResponse('', 404));

    await expect(admin.request(session, SHOP_QUERY)).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });
    await expect(admin.request(session, SHOP_QUERY)).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: expect.stringContaining('ShopDetails failed'),
    });
    await expect(admin.request(session, SHOP_QUERY)).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
    });
    await expect(admin.request(session, SHOP_QUERY)).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
    });
    expect(sleeper.waits).toEqual([]);
  });
});
