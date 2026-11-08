import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { describeConnectorContract } from '../sdk/testing/connector-contract.js';
import { jsonResponse } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import {
  ACCOUNT_ID,
  ACCOUNT_URL,
  API,
  createGoogleTestKit,
  FIXTURES,
  googleSession,
  googleSettings,
  TOKEN_URL,
} from './google-merchant.fixtures.js';
import { GoogleTargetCountry } from './google-merchant-country.js';

const REDIRECT_URI = 'http://localhost:3000/api/v1/channels/google_merchant/oauth/callback';
const callback = (query: Record<string, string>) => ({
  query,
  redirectUri: REDIRECT_URI,
  accountHandle: ACCOUNT_ID,
});

describeConnectorContract(() => createGoogleTestKit().connector, {
  validAccountHandle: ACCOUNT_ID,
  invalidAccountHandles: ['', 'acme-store', 'EBAY_US', '12.34'],
});

function expectAccount(kit: ReturnType<typeof createGoogleTestKit>, businessInfo = true): void {
  kit.http
    .expect(HttpMethod.Get, ACCOUNT_URL, fixtureResponse(FIXTURES, 'account.json'))
    .expect(HttpMethod.Get, `${ACCOUNT_URL}/homepage`, fixtureResponse(FIXTURES, 'homepage.json'))
    .expect(
      HttpMethod.Get,
      `${ACCOUNT_URL}/businessInfo`,
      businessInfo
        ? fixtureResponse(FIXTURES, 'business-info.json')
        : jsonResponse({ error: { code: 404, status: 'NOT_FOUND' } }, 404),
    );
}

describe('GoogleMerchantConnector', () => {
  it('takes the Merchant Center id as typed, with or without dashes', () => {
    const { connector } = createGoogleTestKit();

    expect(connector.normalizeAccountHandle(' 123-456-789 ')).toBe('123456789');
    const url = connector.authorizationUrl({
      accountHandle: ACCOUNT_ID,
      state: 'signed-state',
      redirectUri: REDIRECT_URI,
    });
    expect(url.searchParams.get('redirect_uri')).toBe(REDIRECT_URI);
  });

  it('connects once the signed-in user can read the account typed', async () => {
    const kit = createGoogleTestKit();
    kit.http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'));
    expectAccount(kit);

    const authorization = await kit.connector.completeAuthorization(callback({ code: '4/code' }));

    expect(authorization).toMatchObject({
      externalAccountId: ACCOUNT_ID,
      grantedScopes: ['https://www.googleapis.com/auth/content'],
      credentials: {
        accessToken: 'ya29.fixture_access_token',
        refreshToken: '1//fixture_refresh_token',
      },
    });
  });

  it('refuses a declined consent and an account the user cannot manage', async () => {
    const kit = createGoogleTestKit();
    await expect(
      kit.connector.completeAuthorization(callback({ error: 'access_denied' })),
    ).rejects.toMatchObject({ code: ChannelErrorCode.AccessDenied });

    kit.http
      .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'))
      .expect(HttpMethod.Get, ACCOUNT_URL, fixtureResponse(FIXTURES, 'account-denied.json', 401));
    await expect(
      kit.connector.completeAuthorization(callback({ code: '4/code' })),
    ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
  });

  it('tells the operator when the Cloud project is not registered with the Merchant API', async () => {
    const kit = createGoogleTestKit();
    kit.http
      .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'))
      .expect(
        HttpMethod.Get,
        ACCOUNT_URL,
        fixtureResponse(FIXTURES, 'project-not-registered.json', 401),
      );

    await expect(
      kit.connector.completeAuthorization(callback({ code: '4/code' })),
    ).rejects.toMatchObject({
      code: ChannelErrorCode.ChannelUnavailable,
      message: expect.stringContaining('not registered with the Merchant API'),
    });
  });

  it('reads the account, its website and its business country', async () => {
    const kit = createGoogleTestKit();
    expectAccount(kit);

    const profile = await kit.connector.describeAccount(googleSession(null));

    expect(profile).toEqual({
      displayName: 'Acme Goods',
      settings: {
        channel: 'google_merchant',
        accountId: ACCOUNT_ID,
        accountName: 'Acme Goods',
        homepageUri: 'https://acme.example',
        homepageClaimed: true,
        country: GoogleTargetCountry.DE,
        currencyCode: 'EUR',
        contentLanguage: 'de',
      },
    });
    expect(kit.connector.parseSettings(profile.settings)).toEqual(profile.settings);
  });

  it('sells in the listing setup’s currency, even after a reconnect read another country', () => {
    const kit = createGoogleTestKit();
    // A reconnect rereads the Israeli business country over a US listing setup.
    const reread = googleSettings({
      country: GoogleTargetCountry.IL,
      currencyCode: 'ILS',
      contentLanguage: 'he',
      listingSetup: {
        country: GoogleTargetCountry.US,
        productUrlTemplate: 'https://acme.example/products/{handle}',
        dataSourceId: 'ds-us',
      },
    });

    expect(kit.connector.parseSettings(reread)).toMatchObject({
      country: 'US',
      currencyCode: 'USD',
      contentLanguage: 'en',
    });
  });

  it('lists in the US when the account has no business country yet', async () => {
    const kit = createGoogleTestKit();
    expectAccount(kit, false);

    const { settings } = await kit.connector.describeAccount(googleSession(null));

    expect(settings).toMatchObject({ country: 'US', currencyCode: 'USD', contentLanguage: 'en' });
  });

  it('keeps the refresh token when Google refreshes the access token', async () => {
    const kit = createGoogleTestKit();
    kit.http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const credentials = await kit.connector.refreshCredentials(ACCOUNT_ID, {
      accessToken: 'old',
      refreshToken: '1//stored',
      refreshTokenExpiresAt: '2026-11-12T10:00:00.000Z',
    });

    expect(credentials).toMatchObject({
      accessToken: 'ya29.fixture_refreshed_token',
      refreshToken: '1//stored',
      refreshTokenExpiresAt: '2026-11-12T10:00:00.000Z',
    });
  });

  it('creates an API data source for the country', async () => {
    const kit = createGoogleTestKit();
    kit.http.expect(
      HttpMethod.Post,
      `${API}/datasources/v1/accounts/${ACCOUNT_ID}/dataSources`,
      fixtureResponse(FIXTURES, 'data-source.json'),
    );

    const id = await kit.connector.createDataSource(googleSession(), GoogleTargetCountry.DE);

    expect(id).toBe('10462800');
    expect(JSON.parse(kit.http.requests[0]?.body ?? '{}')).toEqual({
      displayName: 'Crossmart (DE)',
      primaryProductDataSource: { contentLanguage: 'de', feedLabel: 'DE', countries: ['DE'] },
    });
  });
});
