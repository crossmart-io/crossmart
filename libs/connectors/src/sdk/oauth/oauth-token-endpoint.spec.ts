import { ChannelType } from '../channel-type.enum.js';
import { ChannelError } from '../errors/channel-error.js';
import { ChannelErrorCode } from '../errors/channel-error-code.enum.js';
import { HttpMethod } from '../http/http-method.enum.js';
import { FakeHttpTransport, jsonResponse } from '../testing/fake-http-transport.js';
import { OAuthClientAuthentication } from './oauth.constants.js';
import { OAuthTokenEndpoint, type OAuthTokenEndpointOptions } from './oauth-token-endpoint.js';

const TOKEN_URL = 'https://auth.example.com/token';
const NOW = new Date('2026-11-05T10:00:00Z');
const CLIENT = { clientId: 'client', clientSecret: 'secret' };
const TOKEN = {
  access_token: 'access',
  token_type: 'Bearer',
  expires_in: 3600,
  refresh_token: 'refresh',
  refresh_token_expires_in: 7200,
  scope: 'read write',
};

function setup(
  clientAuthentication = OAuthClientAuthentication.RequestBody,
  extra: Partial<OAuthTokenEndpointOptions> = {},
) {
  const http = new FakeHttpTransport();
  const endpoint = new OAuthTokenEndpoint(http, {
    tokenUrl: () => TOKEN_URL,
    client: () => CLIENT,
    clientAuthentication,
    error: (code, message) => new ChannelError(ChannelType.Ebay, code, message),
    messages: { exchangeFailed: 'No token', refreshRejected: 'Connect again' },
    ...extra,
  });
  const form = (): Record<string, string> =>
    Object.fromEntries(new URLSearchParams(http.requests[0]?.body ?? ''));
  return { http, endpoint, form };
}

describe('OAuthTokenEndpoint', () => {
  it('exchanges a code with the client in the form, and lists the granted scopes', async () => {
    const { http, endpoint, form } = setup();
    http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse(TOKEN));

    const grant = await endpoint.exchangeCode('code', 'https://app/callback', NOW);

    expect(grant).toEqual({
      credentials: {
        accessToken: 'access',
        refreshToken: 'refresh',
        accessTokenExpiresAt: '2026-11-05T11:00:00.000Z',
        refreshTokenExpiresAt: '2026-11-05T12:00:00.000Z',
      },
      grantedScopes: ['read', 'write'],
    });
    expect(form()).toEqual({
      grant_type: 'authorization_code',
      code: 'code',
      redirect_uri: 'https://app/callback',
      client_id: 'client',
      client_secret: 'secret',
    });
    expect(http.requests[0]?.headers?.authorization).toBeUndefined();
  });

  it('sends the client as HTTP Basic auth, and has no scopes when none are listed', async () => {
    const { http, endpoint, form } = setup(OAuthClientAuthentication.HttpBasic);
    http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ ...TOKEN, scope: undefined }));

    const grant = await endpoint.exchangeCode('code', 'ru-name', NOW);

    expect(grant.grantedScopes).toBeNull();
    expect(http.requests[0]?.headers?.authorization).toBe(
      `Basic ${Buffer.from('client:secret').toString('base64')}`,
    );
    expect(form()).not.toHaveProperty('client_secret');
  });

  it('refreshes with the scopes asked for, keeping the stored refresh token', async () => {
    const { http, endpoint, form } = setup();
    http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ ...TOKEN, refresh_token: 'rotated' }));

    const refreshed = await endpoint.refresh(
      {
        accessToken: 'old',
        refreshToken: 'stored',
        refreshTokenExpiresAt: '2027-01-01T00:00:00.000Z',
      },
      { scopes: ['read', 'write'], now: NOW },
    );

    expect(refreshed).toMatchObject({
      accessToken: 'access',
      refreshToken: 'stored',
      refreshTokenExpiresAt: '2027-01-01T00:00:00.000Z',
    });
    expect(form()).toMatchObject({
      grant_type: 'refresh_token',
      refresh_token: 'stored',
      scope: 'read write',
    });
  });

  it('sends a public client’s id alone, with the PKCE verifier', async () => {
    const { http, endpoint, form } = setup(OAuthClientAuthentication.None);
    http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse(TOKEN));

    await endpoint.exchangeCode('code', 'https://app/callback', NOW, 'verifier');

    expect(form()).toEqual({
      grant_type: 'authorization_code',
      code: 'code',
      redirect_uri: 'https://app/callback',
      client_id: 'client',
      code_verifier: 'verifier',
    });
    expect(http.requests[0]?.headers?.authorization).toBeUndefined();
  });

  it('keeps a rotated refresh token, dated by the documented lifetime', async () => {
    const { http, endpoint } = setup(OAuthClientAuthentication.None, {
      rotatesRefreshTokens: true,
      refreshTokenLifetimeSeconds: 86_400,
    });
    const rotated = { ...TOKEN, refresh_token: 'rotated', refresh_token_expires_in: undefined };
    http
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse(rotated))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ ...rotated, refresh_token: undefined }));

    const refreshed = await endpoint.refresh(
      { accessToken: 'old', refreshToken: 'stored' },
      { now: NOW },
    );
    const unrotated = await endpoint.refresh(
      { accessToken: 'old', refreshToken: 'stored' },
      { now: NOW },
    );

    expect(refreshed).toMatchObject({
      refreshToken: 'rotated',
      refreshTokenExpiresAt: '2026-11-06T10:00:00.000Z',
    });
    expect(unrotated.refreshToken).toBe('stored');
  });

  it('asks to reconnect without a refresh token, or on invalid_grant (400 or 401)', async () => {
    const { http, endpoint } = setup();
    http
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'invalid_grant' }, 400))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'invalid_grant' }, 401));
    const rejected = { code: ChannelErrorCode.CredentialsRejected, message: 'Connect again' };

    await expect(endpoint.refresh({ accessToken: 'old' })).rejects.toMatchObject(rejected);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(
        endpoint.refresh({ accessToken: 'old', refreshToken: 'revoked' }),
      ).rejects.toMatchObject(rejected);
    }
    expect(http.requests).toHaveLength(2);
  });

  it('rejects other refusals naming only the OAuth error code', async () => {
    const { http, endpoint } = setup();
    http
      .expect(
        HttpMethod.Post,
        TOKEN_URL,
        jsonResponse({ error: 'redirect_uri_mismatch', error_description: 'secret-detail' }, 400),
      )
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'invalid_grant' }, 400))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse('<html>secret-detail', 403));

    await expect(endpoint.exchangeCode('code', 'uri')).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: 'No token (redirect_uri_mismatch)',
    });
    await expect(endpoint.exchangeCode('code', 'uri')).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: 'No token (invalid_grant)',
    });
    await expect(endpoint.exchangeCode('code', 'uri')).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
      message: 'No token',
    });
  });

  it('reports an outage on a 5xx or a response that is not a token', async () => {
    const { http, endpoint } = setup();
    http
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ error: 'server_error' }, 503))
      .expect(HttpMethod.Post, TOKEN_URL, jsonResponse({ unexpected: 'secret-detail' }));
    const outage = { code: ChannelErrorCode.ChannelUnavailable, message: 'No token' };

    await expect(endpoint.exchangeCode('code', 'uri')).rejects.toMatchObject(outage);
    await expect(endpoint.request({ grant_type: 'client_credentials' })).rejects.toMatchObject(
      outage,
    );
  });
});
