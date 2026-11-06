import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { PublishRequirement } from '../sdk/publishing/publish-requirement.enum.js';
import type { PublishCandidate } from '../sdk/publishing/unmet-publish-requirement.js';
import { describeConnectorContract } from '../sdk/testing/connector-contract.js';
import { jsonResponse } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import { EtsyApp } from './etsy-app.js';
import {
  createEtsyTestKit,
  etsySession,
  etsySettings,
  expectShopReads,
  FIXTURES,
  ME_URL,
  SHOP_HANDLE,
  SHOP_ID,
  SHOP_URL,
  TAXONOMY_URL,
  TEST_KEYSTRING,
  TEST_SHARED_SECRET,
  TOKEN_URL,
} from './etsy.fixtures.js';
import { type EtsySettings, isEtsySettings } from './etsy-settings.js';

const REDIRECT_URI = 'https://api.example.com/api/v1/channels/etsy/oauth/callback';
const VERIFIER = 'a'.repeat(43);
const CALLBACK = {
  query: { code: 'fixture-code', state: 'signed-state' },
  redirectUri: REDIRECT_URI,
  accountHandle: SHOP_HANDLE,
  codeVerifier: VERIFIER,
};

describeConnectorContract(
  () => {
    const { connector } = createEtsyTestKit();
    const authorizationUrl = connector.authorizationUrl.bind(connector);
    // The contract signs a URL without a verifier; Crossmart always derives one for Etsy.
    connector.authorizationUrl = (request) =>
      authorizationUrl({ ...request, codeVerifier: VERIFIER });
    return connector;
  },
  {
    validAccountHandle: 'ClayAndKiln',
    invalidAccountHandles: ['', 'abc', 'clay and kiln', 'a'.repeat(21), 'shop.etsy.com', 'EBAY_US'],
  },
);

function expectAuthorization(
  http: ReturnType<typeof createEtsyTestKit>['http'],
  me = 'me.json',
): void {
  http
    .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'))
    .expect(HttpMethod.Get, ME_URL, fixtureResponse(FIXTURES, me));
}

describe('EtsyConnector', () => {
  it('declares what it does, and is not ready without an app', () => {
    const { connector } = createEtsyTestKit();
    const unconfigured = createEtsyTestKit(new EtsyApp(null)).connector;

    expect(connector.channel).toBe(ChannelType.Etsy);
    expect([...connector.capabilities]).toEqual([
      ChannelCapability.PublishListings,
      ChannelCapability.UpdatePrice,
      ChannelCapability.ProvideTaxonomy,
      ChannelCapability.FetchOrders,
      ChannelCapability.UpdateInventory,
    ]);
    expect(connector.requiredScopes).toEqual([
      'listings_r',
      'listings_w',
      'shops_r',
      'transactions_r',
    ]);
    expect(connector.contentLimits).toMatchObject({
      titleMaxLength: 140,
      tagMaxCount: 13,
      tagMaxLength: 20,
    });
    expect(connector.isConfigured()).toBe(true);
    expect(unconfigured.isConfigured()).toBe(false);
  });

  it('names the shop as the account handle, lower-cased', () => {
    const { connector } = createEtsyTestKit();

    expect(connector.normalizeAccountHandle(' ClayAndKiln ')).toBe(SHOP_HANDLE);
    expect(connector.normalizeAccountHandle('Clay&Kiln')).toBeNull();
  });

  describe('completeAuthorization', () => {
    it('exchanges the code with the verifier and names the account by its shop id', async () => {
      const { connector, http } = createEtsyTestKit();
      expectAuthorization(http);
      http.expect(HttpMethod.Get, SHOP_URL, fixtureResponse(FIXTURES, 'shop.json'));

      const authorization = await connector.completeAuthorization(CALLBACK);

      expect(authorization).toMatchObject({
        externalAccountId: SHOP_ID,
        grantedScopes: ['listings_r', 'listings_w', 'shops_r', 'transactions_r'],
        credentials: { accessToken: '12345678.fixture_access_token' },
      });
      expect(new URLSearchParams(http.requests[0]?.body).get('code_verifier')).toBe(VERIFIER);
      expect(http.requests[1]?.headers?.['x-api-key']).toBe(
        `${TEST_KEYSTRING}:${TEST_SHARED_SECRET}`,
      );
      expect(http.requests[1]?.headers?.authorization).toBe('Bearer 12345678.fixture_access_token');
      http.assertDone();
    });

    it('refuses a shop other than the one the merchant named', async () => {
      const { connector, http } = createEtsyTestKit();
      expectAuthorization(http);
      http.expect(HttpMethod.Get, SHOP_URL, fixtureResponse(FIXTURES, 'shop.json'));

      await expect(
        connector.completeAuthorization({ ...CALLBACK, accountHandle: 'othershop' }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
    });

    it('refuses a grant without every scope Crossmart needs', async () => {
      const { connector, http } = createEtsyTestKit();
      http.expect(
        HttpMethod.Post,
        TOKEN_URL,
        jsonResponse({
          access_token: '12345678.a',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: '12345678.r',
          scope: 'listings_r shops_r',
        }),
      );

      await expect(connector.completeAuthorization(CALLBACK)).rejects.toMatchObject({
        code: ChannelErrorCode.MissingScopes,
      });
    });

    it('refuses an account without a shop, and a callback without a code', async () => {
      const { connector, http } = createEtsyTestKit();
      expectAuthorization(http, 'me-without-shop.json');

      await expect(connector.completeAuthorization(CALLBACK)).rejects.toMatchObject({
        code: ChannelErrorCode.InvalidAccount,
        message: expect.stringContaining('no shop'),
      });
      await expect(
        connector.completeAuthorization({ ...CALLBACK, query: { state: 'signed-state' } }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.AccessDenied });
    });
  });

  it('reads the shop and its live shipping and processing profiles, and nothing else', async () => {
    const { connector, http } = createEtsyTestKit();
    expectShopReads(http);

    const profile = await connector.describeAccount(etsySession(null));

    expect(profile).toEqual({
      displayName: 'ClayAndKiln',
      settings: {
        channel: ChannelType.Etsy,
        shopId: SHOP_ID,
        shopName: 'ClayAndKiln',
        userId: '12345678',
        currencyCode: 'USD',
        shopUrl: 'https://www.etsy.com/shop/ClayAndKiln',
        profiles: {
          shipping: [
            { id: '6722757781', name: 'Free US shipping' },
            { id: '6722757782', name: '6722757782' },
          ],
          processing: [
            { id: '18201076875', name: 'Ready to ship · 1-3 days' },
            { id: '18201056977', name: 'Made to order · 5–8 days' },
          ],
        },
      },
    });
    expect(JSON.stringify(profile)).not.toContain('fixture_owner_login');
    expect(isEtsySettings(connector.parseSettings(profile.settings))).toBe(true);
  });

  it('names what the listing setup lacks', () => {
    const { connector } = createEtsyTestKit();
    const requirements = (settings: EtsySettings | null) =>
      connector.unmetAccountRequirements(settings).map(({ requirement }) => requirement);
    const settings = etsySettings();

    expect(requirements(settings)).toEqual([]);
    expect(requirements(null)).toEqual([PublishRequirement.AccountSettings]);
    expect(requirements({ ...settings, listingSetup: undefined })).toEqual([
      PublishRequirement.ItemDetails,
      PublishRequirement.ShippingProfile,
      PublishRequirement.ProcessingProfile,
    ]);
    const gone = { ...settings.listingSetup!, shippingProfileId: '999', processingProfileId: null };
    expect(requirements({ ...settings, listingSetup: gone })).toEqual([
      PublishRequirement.ShippingProfile,
      PublishRequirement.ProcessingProfile,
    ]);
    const onlyOne = {
      shipping: [settings.profiles.shipping[0]!],
      processing: [settings.profiles.processing[0]!],
    };
    expect(requirements({ ...settings, listingSetup: gone, profiles: onlyOne })).toEqual([]);
  });

  it('names what a product lacks: an https image, and option names for its variants', () => {
    const { connector } = createEtsyTestKit();
    const product: PublishCandidate = {
      imageUrls: ['https://cdn.example/a.jpg'],
      active: false,
      optionNames: [],
      variantCount: 1,
    };
    const requirements = (candidate: PublishCandidate) =>
      connector.unmetProductRequirements(candidate).map(({ requirement }) => requirement);

    expect(requirements(product)).toEqual([]);
    expect(
      requirements({ ...product, imageUrls: ['http://cdn.example/a.jpg'], variantCount: 2 }),
    ).toEqual([PublishRequirement.Images, PublishRequirement.OptionNames]);
    expect(
      requirements({ ...product, variantCount: 2, optionNames: ['A', 'B', 'C', 'D'] }),
    ).toEqual([PublishRequirement.OptionNames]);
  });

  it('suggests seller taxonomy leaves by title words, best first, and reads the tree once', async () => {
    const { connector, http, session } = createEtsyTestKit();
    http.expect(HttpMethod.Get, TAXONOMY_URL, fixtureResponse(FIXTURES, 'seller-taxonomy.json'));

    const mugs = await connector.suggestCategories(session, 'Speckled stoneware coffee mug');
    const kitchen = await connector.suggestCategories(session, 'kitchen glasses');
    const none = await connector.suggestCategories(session, 'zz');

    expect(mugs).toEqual([
      { id: '1076', name: 'Home & Living > Kitchen & Dining > Drink & Barware > Mugs' },
    ]);
    expect(kitchen.map(({ id }) => id)).toEqual(['1078', '1076', '1101']);
    expect(none).toEqual([]);
    expect(http.requests).toHaveLength(1);
  });

  it('offers materials as the item specific of every category', async () => {
    const { connector, session } = createEtsyTestKit();

    await expect(connector.categoryAspects(session, '1076')).resolves.toEqual([
      expect.objectContaining({ name: 'Materials', required: false, multiple: true }),
    ]);
  });
});
