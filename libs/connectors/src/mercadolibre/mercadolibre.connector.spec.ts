import { CategoryAspectMode, CategoryAspectUsage } from '../sdk/capabilities/taxonomy-provider.js';
import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { describeConnectorContract } from '../sdk/testing/connector-contract.js';
import { jsonResponse } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import {
  ACCESS_TOKEN,
  API,
  ATTRIBUTES_URL,
  CATEGORY_URL,
  createMercadoLibreTestKit,
  FIXTURES,
  fixtureJson,
  ME_URL,
  mercadoLibreSession,
  TEST_APP_ID,
  TOKEN_URL,
  USER_ID,
} from './mercadolibre.fixtures.js';
import { MercadoLibreApp } from './mercadolibre-app.js';
import { MercadoLibreSiteId } from './mercadolibre-site.js';

const REDIRECT_URI = 'https://api.example.com/api/v1/channels/mercado_libre/oauth/callback';
const VERIFIER = 'a'.repeat(43);
const CALLBACK = {
  query: { code: 'TG-fixture-code', state: 'signed-state' },
  redirectUri: REDIRECT_URI,
  accountHandle: MercadoLibreSiteId.Argentina,
  codeVerifier: VERIFIER,
};

describeConnectorContract(() => createMercadoLibreTestKit().connector, {
  validAccountHandle: 'mlm',
  invalidAccountHandles: ['', 'MLX', 'EBAY_US', 'Mexico', 'clayandkiln'],
});

function form(body: string | undefined): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(body ?? ''));
}

describe('MercadoLibreConnector', () => {
  it('declares what it does, and is not ready without an app', () => {
    const { connector } = createMercadoLibreTestKit();
    const unconfigured = createMercadoLibreTestKit(new MercadoLibreApp(null)).connector;

    expect(connector.channel).toBe(ChannelType.MercadoLibre);
    expect([...connector.capabilities]).toEqual([
      ChannelCapability.PublishListings,
      ChannelCapability.UpdatePrice,
      ChannelCapability.ProvideTaxonomy,
      ChannelCapability.FetchOrders,
      ChannelCapability.UpdateInventory,
      ChannelCapability.ReceiveWebhooks,
    ]);
    expect(connector.requiredScopes).toEqual(['offline_access', 'read', 'write']);
    expect(connector.contentLimits).toMatchObject({ titleMaxLength: 60, allowsLinks: false });
    expect(connector.isConfigured()).toBe(true);
    expect(unconfigured.isConfigured()).toBe(false);
  });

  it('signs the seller in on their country’s site, with the PKCE challenge', () => {
    const { connector } = createMercadoLibreTestKit();

    const chile = connector.authorizationUrl({
      accountHandle: 'MLC',
      state: 'signed-state',
      redirectUri: REDIRECT_URI,
      codeVerifier: VERIFIER,
    });
    const brazil = connector.authorizationUrl({
      accountHandle: 'MLB',
      state: 'signed-state',
      redirectUri: REDIRECT_URI,
    });

    expect(chile.origin + chile.pathname).toBe('https://auth.mercadolibre.cl/authorization');
    expect(Object.fromEntries(chile.searchParams)).toEqual({
      response_type: 'code',
      client_id: TEST_APP_ID,
      redirect_uri: REDIRECT_URI,
      state: 'signed-state',
      code_challenge: expect.any(String) as string,
      code_challenge_method: 'S256',
    });
    expect(brazil.origin).toBe('https://auth.mercadolivre.com.br');
    expect(brazil.searchParams.has('code_challenge')).toBe(false);
  });

  describe('completeAuthorization', () => {
    it('exchanges the code and names the account by the seller’s user id', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http
        .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'))
        .expect(HttpMethod.Get, ME_URL, fixtureResponse(FIXTURES, 'user-me.json'));

      const authorization = await connector.completeAuthorization(CALLBACK);

      expect(authorization).toEqual({
        externalAccountId: USER_ID,
        grantedScopes: ['offline_access', 'read', 'write'],
        credentials: {
          accessToken: ACCESS_TOKEN,
          refreshToken: 'TG-5b9032b4e23464aed1f959f-1234567',
          accessTokenExpiresAt: expect.any(String) as string,
          refreshTokenExpiresAt: expect.any(String) as string,
        },
      });
      expect(form(http.requests[0]?.body)).toEqual({
        grant_type: 'authorization_code',
        code: 'TG-fixture-code',
        redirect_uri: REDIRECT_URI,
        code_verifier: VERIFIER,
        client_id: TEST_APP_ID,
        client_secret: 'test-secret-key',
      });
      expect(http.requests[1]?.headers?.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
      http.assertDone();
    });

    it('refuses a seller of another country than the one picked', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http
        .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'))
        .expect(HttpMethod.Get, ME_URL, fixtureResponse(FIXTURES, 'user-me.json'));

      await expect(
        connector.completeAuthorization({ ...CALLBACK, accountHandle: MercadoLibreSiteId.Mexico }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
    });

    it('refuses a grant without offline access, and a callback without a code', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      const token = { ...fixtureJson('access-token.json'), scope: 'read write' };
      http.expect(HttpMethod.Post, TOKEN_URL, jsonResponse(token));

      await expect(connector.completeAuthorization(CALLBACK)).rejects.toMatchObject({
        code: ChannelErrorCode.MissingScopes,
      });
      await expect(
        connector.completeAuthorization({ ...CALLBACK, query: { error: 'access_denied' } }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.AccessDenied });
    });
  });

  describe('refreshCredentials', () => {
    it('keeps the new single-use refresh token', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

      const refreshed = await connector.refreshCredentials(USER_ID, {
        accessToken: 'old',
        refreshToken: 'TG-stored',
      });

      expect(refreshed.refreshToken).toBe('TG-5b9032b4e4b0714aed1f959f-8035443');
      expect(form(http.requests[0]?.body)).toMatchObject({
        grant_type: 'refresh_token',
        refresh_token: 'TG-stored',
        client_id: TEST_APP_ID,
      });
    });

    it('asks to connect again when the refresh token was used or expired', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'invalid-grant.json', 400));

      await expect(
        connector.refreshCredentials(USER_ID, { accessToken: 'old', refreshToken: 'TG-used' }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.CredentialsRejected });
    });
  });

  it('revokes the app’s grant on disconnect', async () => {
    const { connector, http } = createMercadoLibreTestKit();
    http.expect(
      HttpMethod.Delete,
      `${API}/users/${USER_ID}/applications/${TEST_APP_ID}`,
      fixtureResponse(FIXTURES, 'revoked-grant.json'),
    );

    await connector.revokeAccess(mercadoLibreSession());

    expect(http.requests[0]?.headers?.authorization).toBe(`Bearer ${ACCESS_TOKEN}`);
    http.assertDone();
  });

  describe('describeAccount', () => {
    it('reads the seller, their site and currency', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http.expect(HttpMethod.Get, ME_URL, fixtureResponse(FIXTURES, 'user-me.json'));

      const profile = await connector.describeAccount(mercadoLibreSession());

      expect(profile).toEqual({
        displayName: 'TETE2870021',
        settings: {
          channel: ChannelType.MercadoLibre,
          userId: USER_ID,
          nickname: 'TETE2870021',
          siteId: MercadoLibreSiteId.Argentina,
          currencyCode: 'ARS',
          permalink: 'http://perfil.mercadolibre.com.ar/TETE2870021',
          userProductSeller: false,
        },
      });
      expect(connector.parseSettings(profile.settings)).toEqual(profile.settings);
    });

    it('notes a User Products seller, and refuses a site Crossmart does not support', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      const me = fixtureJson<{ tags: string[] }>('user-me.json');
      http
        .expect(
          HttpMethod.Get,
          ME_URL,
          jsonResponse({ ...me, tags: [...me.tags, 'user_product_seller'] }),
        )
        .expect(HttpMethod.Get, ME_URL, jsonResponse({ ...me, site_id: 'MLU' }));

      const profile = await connector.describeAccount(mercadoLibreSession());

      expect(profile.settings.userProductSeller).toBe(true);
      await expect(connector.describeAccount(mercadoLibreSession())).rejects.toMatchObject({
        code: ChannelErrorCode.InvalidAccount,
      });
    });
  });

  describe('taxonomy', () => {
    it('predicts categories for a title on the seller’s site, named with their path', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      http
        .expect(
          HttpMethod.Get,
          `${API}/sites/MLA/domain_discovery/search?q=celular+iphone&limit=4`,
          fixtureResponse(FIXTURES, 'domain-discovery.json'),
        )
        .expect(HttpMethod.Get, CATEGORY_URL, fixtureResponse(FIXTURES, 'category.json'));

      const categories = await connector.suggestCategories(mercadoLibreSession(), 'celular iphone');

      expect(categories).toEqual([
        { id: 'MLA1055', name: 'Celulares y Teléfonos > Celulares y Smartphones' },
      ]);
    });

    it('offers the attributes sellers can set, required first', async () => {
      const { connector, http } = createMercadoLibreTestKit();
      const attributes = fixtureJson<{ id: string; tags: Record<string, boolean> }[]>(
        'category-attributes.json',
      );
      const model = attributes.find((attribute) => attribute.id === 'MODEL');
      if (model) model.tags = { required: true };
      http.expect(HttpMethod.Get, ATTRIBUTES_URL, jsonResponse(attributes));

      const aspects = await connector.categoryAspects(mercadoLibreSession(), 'MLA1055');

      expect(aspects.map((aspect) => aspect.name)).toEqual(['Modelo']);
      expect(aspects[0]).toEqual({
        name: 'Modelo',
        required: true,
        usage: CategoryAspectUsage.Optional,
        mode: CategoryAspectMode.FreeText,
        multiple: false,
        values: [],
      });
    });
  });
});
