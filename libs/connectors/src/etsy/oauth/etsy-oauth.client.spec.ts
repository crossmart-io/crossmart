import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { pkceS256Challenge } from '../../sdk/oauth/pkce.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { EtsyApp } from '../etsy-app.js';
import { createEtsyTestKit, FIXTURES, TEST_KEYSTRING, TOKEN_URL } from '../etsy.fixtures.js';

const NOW = new Date('2026-11-06T10:00:00Z');
const REDIRECT_URI = 'https://api.example.com/api/v1/channels/etsy/oauth/callback';
const VERIFIER = 'vvkdljkejllufrvbhgeiegrnvufrhvrffnkvcknjvfid';

describe('EtsyOAuthClient', () => {
  it('builds the sign-in URL with the scopes and the S256 challenge of the verifier', () => {
    const { oauth } = createEtsyTestKit();

    const url = oauth.authorizationUrl({
      state: 'signed-state',
      redirectUri: REDIRECT_URI,
      codeVerifier: VERIFIER,
    });

    expect(`${url.origin}${url.pathname}`).toBe('https://www.etsy.com/oauth/connect');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: 'code',
      client_id: TEST_KEYSTRING,
      redirect_uri: REDIRECT_URI,
      scope: 'listings_r listings_w shops_r transactions_r',
      state: 'signed-state',
      code_challenge: 'DSWlW2Abh-cf8CeLL8-g3hQ2WQyYdKyiu83u_s7nRhI',
      code_challenge_method: 'S256',
    });
    expect(url.search).toContain('listings_r%20listings_w');
    expect(pkceS256Challenge(VERIFIER)).toBe(url.searchParams.get('code_challenge'));
  });

  it('refuses to sign in without a verifier, as Etsy requires PKCE', () => {
    const { oauth } = createEtsyTestKit();

    expect(() => oauth.authorizationUrl({ state: 's', redirectUri: REDIRECT_URI })).toThrow(/PKCE/);
  });

  it('exchanges the code with the keystring and the verifier, and no secret', async () => {
    const { oauth, http } = createEtsyTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'));

    const grant = await oauth.exchangeCode(
      'fixture-code',
      { redirectUri: REDIRECT_URI, codeVerifier: VERIFIER },
      NOW,
    );

    expect(grant).toEqual({
      credentials: {
        accessToken: '12345678.fixture_access_token',
        refreshToken: '12345678.fixture_refresh_token',
        accessTokenExpiresAt: '2026-11-06T11:00:00.000Z',
        refreshTokenExpiresAt: '2027-02-04T10:00:00.000Z',
      },
      grantedScopes: ['listings_r', 'listings_w', 'shops_r', 'transactions_r'],
    });
    const [request] = http.requests;
    expect(request?.headers?.authorization).toBeUndefined();
    expect(Object.fromEntries(new URLSearchParams(request?.body))).toEqual({
      grant_type: 'authorization_code',
      code: 'fixture-code',
      redirect_uri: REDIRECT_URI,
      client_id: TEST_KEYSTRING,
      code_verifier: VERIFIER,
    });
  });

  it('keeps the rotated refresh token Etsy issues on refresh', async () => {
    const { oauth, http } = createEtsyTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const refreshed = await oauth.refresh(
      { accessToken: 'old', refreshToken: '12345678.fixture_refresh_token' },
      NOW,
    );

    expect(refreshed).toEqual({
      accessToken: '12345678.fixture_refreshed_token',
      refreshToken: '12345678.fixture_rotated_refresh_token',
      accessTokenExpiresAt: '2026-11-06T11:00:00.000Z',
      refreshTokenExpiresAt: '2027-02-04T10:00:00.000Z',
    });
    expect(Object.fromEntries(new URLSearchParams(http.requests[0]?.body))).toEqual({
      grant_type: 'refresh_token',
      refresh_token: '12345678.fixture_refresh_token',
      client_id: TEST_KEYSTRING,
    });
  });

  it('asks to reconnect when the refresh token expired, without leaking the body', async () => {
    const { oauth, http } = createEtsyTestKit();
    http
      .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'invalid-grant.json', 400))
      .expect(
        HttpMethod.Post,
        TOKEN_URL,
        jsonResponse({ error: 'invalid_request', detail: 'secret-detail' }, 400),
      );

    const expired = await oauth
      .refresh({ accessToken: 'old', refreshToken: 'expired' })
      .catch((caught: unknown) => caught);
    const rejected = await oauth
      .exchangeCode('code', { redirectUri: REDIRECT_URI, codeVerifier: VERIFIER })
      .catch((caught: unknown) => caught);

    expect(expired).toMatchObject({ code: ChannelErrorCode.CredentialsRejected });
    expect(String(expired)).toContain('Connect the Etsy shop again');
    expect(rejected).toMatchObject({ code: ChannelErrorCode.RequestRejected });
    expect(String(rejected)).not.toContain('secret-detail');
  });

  it('is not configured without an app', () => {
    const { oauth } = createEtsyTestKit(new EtsyApp(null));

    expect(oauth.isConfigured).toBe(false);
    expect(() =>
      oauth.authorizationUrl({ state: 's', redirectUri: REDIRECT_URI, codeVerifier: VERIFIER }),
    ).toThrow(/not configured/);
  });
});
