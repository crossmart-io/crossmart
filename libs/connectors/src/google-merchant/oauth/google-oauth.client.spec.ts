import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { FakeHttpTransport, jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../../sdk/testing/fixtures.js';
import { GoogleMerchantApp } from '../google-merchant-app.js';
import { GoogleOAuthClient } from './google-oauth.client.js';

const FIXTURES = new URL('../__fixtures__/', import.meta.url);
const APP = { clientId: 'test-client.apps.googleusercontent.com', clientSecret: 'test-secret' };
const REDIRECT = 'https://api.example.com/api/v1/channels/google_merchant/oauth/callback';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

function setup(app: typeof APP | null = APP) {
  const http = new FakeHttpTransport();
  return { http, oauth: new GoogleOAuthClient(new GoogleMerchantApp(app), http) };
}

function formOf(http: FakeHttpTransport): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(http.requests[0]?.body ?? ''));
}

describe('GoogleOAuthClient', () => {
  it('asks for offline access with consent, so Google issues a refresh token', () => {
    const { oauth } = setup();

    const url = oauth.authorizationUrl('signed-state', REDIRECT);

    expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: APP.clientId,
      redirect_uri: REDIRECT,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/content',
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true',
      state: 'signed-state',
    });
  });

  it('exchanges a code with the client secret in the form, never in the URL', async () => {
    const { oauth, http } = setup();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'));

    const token = await oauth.exchangeCode('4/code', REDIRECT);

    expect(token.refresh_token).toBe('1//fixture_refresh_token');
    expect(formOf(http)).toEqual({
      grant_type: 'authorization_code',
      code: '4/code',
      redirect_uri: REDIRECT,
      client_id: APP.clientId,
      client_secret: APP.clientSecret,
    });
  });

  it('refreshes with the stored refresh token', async () => {
    const { oauth, http } = setup();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const token = await oauth.refresh({ accessToken: 'old', refreshToken: '1//stored' });

    expect(token.access_token).toBe('ya29.fixture_refreshed_token');
    expect(formOf(http)).toMatchObject({ grant_type: 'refresh_token', refresh_token: '1//stored' });
  });

  it('asks to reconnect when the refresh token is revoked or expired', async () => {
    const { oauth, http } = setup();
    http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'invalid_grant' }, 400));

    await expect(
      oauth.refresh({ accessToken: 'old', refreshToken: '1//revoked' }),
    ).rejects.toMatchObject({ code: ChannelErrorCode.CredentialsRejected });
  });

  it('reports an outage when Google fails, and is unconfigured without a client', async () => {
    const { oauth, http } = setup();
    http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse({}, 503));

    await expect(oauth.exchangeCode('4/code', REDIRECT)).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
    });
    expect(setup(null).oauth.isConfigured).toBe(false);
  });

  it('revokes a token', async () => {
    const { oauth, http } = setup();
    http.expect(HttpMethod.Post, 'https://oauth2.googleapis.com/revoke', jsonResponse({}));

    await oauth.revoke('ya29.token');

    expect(formOf(http)).toEqual({ token: 'ya29.token' });
  });
});
