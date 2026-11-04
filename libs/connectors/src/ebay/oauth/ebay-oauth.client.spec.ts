import { EbayEnvironment } from '@crossmart/common';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { EbayApp } from '../ebay-app.js';
import {
  createEbayTestKit,
  FIXTURES,
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  TEST_EBAY_APP,
  TEST_RU_NAME,
  TOKEN_URL,
} from '../ebay.fixtures.js';

const NOW = new Date('2026-11-05T10:00:00Z');
const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
].join(' ');
const BASIC = `Basic ${Buffer.from(`${TEST_CLIENT_ID}:${TEST_CLIENT_SECRET}`).toString('base64')}`;

describe('EbayOAuthClient', () => {
  it('builds the sign-in URL with the RuName as redirect_uri and space-separated scopes', () => {
    const { oauth } = createEbayTestKit();

    const url = oauth.authorizationUrl('signed-state');

    expect(`${url.origin}${url.pathname}`).toBe('https://auth.sandbox.ebay.com/oauth2/authorize');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: TEST_CLIENT_ID,
      response_type: 'code',
      redirect_uri: TEST_RU_NAME,
      scope: SCOPES,
      state: 'signed-state',
    });
    expect(url.search).toContain('%20');
    expect(url.search).not.toContain('+');
  });

  it('signs in on production hosts with a production keyset', () => {
    const app = new EbayApp({ ...TEST_EBAY_APP, environment: EbayEnvironment.Production });
    const { oauth } = createEbayTestKit(app);

    expect(oauth.authorizationUrl('s').origin).toBe('https://auth.ebay.com');
  });

  it('exchanges a code with basic auth and the RuName', async () => {
    const { oauth, http } = createEbayTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'));

    const credentials = await oauth.exchangeCode('v^1.1#code', NOW);

    expect(credentials).toEqual({
      accessToken: 'v^1.1#i^1#fixture_access_token',
      refreshToken: 'v^1.1#i^1#fixture_refresh_token',
      accessTokenExpiresAt: '2026-11-05T12:00:00.000Z',
      refreshTokenExpiresAt: '2028-05-05T22:00:00.000Z',
    });
    const [request] = http.requests;
    expect(request.headers?.authorization).toBe(BASIC);
    expect(request.headers?.['content-type']).toBe('application/x-www-form-urlencoded');
    expect(Object.fromEntries(new URLSearchParams(request.body))).toEqual({
      grant_type: 'authorization_code',
      code: 'v^1.1#code',
      redirect_uri: TEST_RU_NAME,
    });
  });

  it('refreshes the access token and keeps the refresh token and its expiry', async () => {
    const { oauth, http } = createEbayTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const refreshed = await oauth.refresh(
      {
        accessToken: 'old',
        refreshToken: 'stored-refresh',
        refreshTokenExpiresAt: '2028-05-05T10:00:00.000Z',
      },
      NOW,
    );

    expect(refreshed).toEqual({
      accessToken: 'v^1.1#i^1#fixture_refreshed_token',
      refreshToken: 'stored-refresh',
      accessTokenExpiresAt: '2026-11-05T12:00:00.000Z',
      refreshTokenExpiresAt: '2028-05-05T10:00:00.000Z',
    });
    expect(Object.fromEntries(new URLSearchParams(http.requests[0].body))).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'stored-refresh',
      scope: SCOPES,
    });
  });

  it('reports an expired or revoked refresh token as rejected credentials', async () => {
    const { oauth, http } = createEbayTestKit();
    http
      .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'invalid-grant.json', 400))
      .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'invalid-grant.json', 401));

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const error = await oauth
        .refresh({ accessToken: 'old', refreshToken: 'expired' })
        .catch((caught: unknown) => caught);
      expect(error).toMatchObject({ code: ChannelErrorCode.CredentialsRejected });
      expect(String(error)).toContain('Connect the eBay account again');
    }
    await expect(oauth.refresh({ accessToken: 'old' })).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });
  });

  it('fails a code exchange without leaking the response body', async () => {
    const { oauth, http } = createEbayTestKit();
    http
      .expect(
        HttpMethod.Post,
        TOKEN_URL,
        jsonResponse({ error: 'invalid_grant', detail: 'secret-detail' }, 400),
      )
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse('<html>secret-detail', 503))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ unexpected: 'secret-detail' }));

    for (const code of [
      ChannelErrorCode.RequestRejected,
      ChannelErrorCode.ChannelUnavailable,
      ChannelErrorCode.ChannelUnavailable,
    ]) {
      const error = await oauth.exchangeCode('code').catch((caught: unknown) => caught);
      expect(error).toMatchObject({ code });
      expect(String(error)).not.toContain('secret-detail');
    }
  });

  it('refuses to start without an app', () => {
    const { oauth } = createEbayTestKit(new EbayApp(null));

    expect(oauth.isConfigured).toBe(false);
    expect(() => oauth.authorizationUrl('s')).toThrow(/not configured/);
  });
});
