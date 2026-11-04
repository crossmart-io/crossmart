import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import {
  createShopifyTestKit,
  FIXTURES,
  SHOP,
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  TOKEN_URL,
} from '../shopify.fixtures.js';

const NOW = new Date('2026-11-03T10:00:00Z');

describe('ShopifyOAuthClient', () => {
  it('builds the authorize URL with the client id, scopes, redirect and state', () => {
    const { oauth } = createShopifyTestKit();

    const url = oauth.authorizationUrl({
      shopDomain: SHOP,
      state: 'signed-state',
      redirectUri: 'http://localhost:3004/api/v1/channels/shopify/oauth/callback',
    });

    expect(url.origin).toBe(`https://${SHOP}`);
    expect(url.pathname).toBe('/admin/oauth/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: TEST_CLIENT_ID,
      scope:
        'read_products,write_products,read_inventory,write_inventory,read_locations,write_publications,read_orders',
      redirect_uri: 'http://localhost:3004/api/v1/channels/shopify/oauth/callback',
      state: 'signed-state',
    });
    expect(url.searchParams.has('grant_options[]')).toBe(false);
  });

  it('exchanges a code for an expiring offline token with its refresh token', async () => {
    const { oauth, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'));

    const grant = await oauth.exchangeCode(SHOP, 'auth-code', NOW);

    expect(grant).toEqual({
      credentials: {
        accessToken: 'shpat_fixture_access',
        refreshToken: 'shprt_fixture_refresh',
        accessTokenExpiresAt: '2026-11-03T11:00:00.000Z',
        refreshTokenExpiresAt: '2027-02-01T10:00:00.000Z',
      },
      grantedScopes: ['write_products', 'write_inventory', 'read_locations'],
    });
    const body = new URLSearchParams(http.requests[0].body);
    expect(Object.fromEntries(body)).toEqual({
      client_id: TEST_CLIENT_ID,
      client_secret: TEST_CLIENT_SECRET,
      code: 'auth-code',
      expiring: '1',
    });
    expect(http.requests[0].headers?.['content-type']).toBe('application/x-www-form-urlencoded');
  });

  it('refreshes with the refresh token grant and returns the rotated pair', async () => {
    const { oauth, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const grant = await oauth.refresh(SHOP, 'shprt_fixture_refresh', NOW);

    expect(grant.credentials.accessToken).toBe('shpat_fixture_refreshed');
    expect(grant.credentials.refreshToken).toBe('shprt_fixture_rotated');
    const body = new URLSearchParams(http.requests[0].body);
    expect(body.get('grant_type')).toBe('refresh_token');
    expect(body.get('refresh_token')).toBe('shprt_fixture_refresh');
  });

  it('reports an expired refresh token as rejected credentials', async () => {
    const { oauth, http } = createShopifyTestKit();
    http.expect(
      HttpMethod.Post,
      TOKEN_URL,
      fixtureResponse(FIXTURES, 'refresh-rejected.json', 401),
    );

    await expect(oauth.refresh(SHOP, 'old')).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });
  });

  it('fails a code exchange without leaking the response body', async () => {
    const { oauth, http } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'secret-detail' }, 400))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse('<html>', 503))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ unexpected: true }));

    for (const code of [
      ChannelErrorCode.RequestRejected,
      ChannelErrorCode.ChannelUnavailable,
      ChannelErrorCode.ChannelUnavailable,
    ]) {
      const error = await oauth.exchangeCode(SHOP, 'code').catch((caught: unknown) => caught);
      expect(error).toMatchObject({ code });
      expect(String(error)).not.toContain('secret-detail');
    }
  });
});
