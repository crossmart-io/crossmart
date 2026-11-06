import { ChannelCapability } from '../sdk/channel-capability.enum.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { describeConnectorContract } from '../sdk/testing/connector-contract.js';
import { fakeChannelSession } from '../sdk/testing/fake-channel-session.js';
import { jsonResponse } from '../sdk/testing/fake-http-transport.js';
import { fixtureResponse } from '../sdk/testing/fixtures.js';
import {
  ACCOUNT_ID,
  createEbayTestKit,
  expectPolicies,
  FIXTURES,
  POLICY_URLS,
  TEST_RU_NAME,
  TOKEN_URL,
  USER_ID,
  USER_URL,
} from './ebay.fixtures.js';
import { isEbaySettings } from './ebay-settings.js';

const REDIRECT_URI = 'http://localhost:3004/api/v1/channels/ebay/oauth/callback';
const CALLBACK = { code: 'v^1.1#code', state: 'signed-state', expires_in: '299' };

describeConnectorContract(() => createEbayTestKit().connector, {
  validAccountHandle: 'EBAY_US',
  invalidAccountHandles: ['', 'EBAY_JP', 'demo-store.myshopify.com', 'EBAY US'],
});

describe('EbayConnector', () => {
  it('names the marketplace as the account handle and signs in with the RuName', () => {
    const { connector } = createEbayTestKit();

    expect(connector.normalizeAccountHandle('ebay_gb')).toBe('EBAY_GB');
    const url = connector.authorizationUrl({
      accountHandle: 'EBAY_GB',
      state: 'signed-state',
      redirectUri: REDIRECT_URI,
    });
    expect(url.searchParams.get('redirect_uri')).toBe(TEST_RU_NAME);
    expect([...connector.capabilities]).toEqual([
      ChannelCapability.PublishListings,
      ChannelCapability.UpdatePrice,
      ChannelCapability.ProvideTaxonomy,
      ChannelCapability.FetchOrders,
      ChannelCapability.UpdateInventory,
    ]);
  });

  describe('completeAuthorization', () => {
    it('exchanges the code and names the account userId:marketplace', async () => {
      const { connector, http } = createEbayTestKit();
      http
        .expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'))
        .expect(HttpMethod.Get, USER_URL, fixtureResponse(FIXTURES, 'user.json'));

      const authorization = await connector.completeAuthorization({
        query: CALLBACK,
        redirectUri: REDIRECT_URI,
        accountHandle: 'EBAY_US',
      });

      expect(authorization.externalAccountId).toBe(ACCOUNT_ID);
      expect(authorization.credentials.accessToken).toBe('v^1.1#i^1#fixture_access_token');
      expect(authorization.credentials.refreshToken).toBe('v^1.1#i^1#fixture_refresh_token');
      expect(authorization.grantedScopes).toEqual([...connector.requiredScopes]);
      expect(http.requests[1].headers?.authorization).toBe('Bearer v^1.1#i^1#fixture_access_token');
    });

    it('refuses an unknown marketplace or a callback without a code before calling eBay', async () => {
      const { connector, http } = createEbayTestKit();

      await expect(
        connector.completeAuthorization({
          query: CALLBACK,
          redirectUri: REDIRECT_URI,
          accountHandle: 'EBAY_JP',
        }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
      await expect(
        connector.completeAuthorization({
          query: { state: 'signed-state' },
          redirectUri: REDIRECT_URI,
          accountHandle: 'EBAY_US',
        }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.AccessDenied });
      expect(http.requests).toEqual([]);
    });
  });

  describe('describeAccount', () => {
    it('reads the user and the business policies of the marketplace', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(HttpMethod.Get, USER_URL, fixtureResponse(FIXTURES, 'user.json'));
      expectPolicies(http);

      const profile = await connector.describeAccount(fakeChannelSession(ACCOUNT_ID));

      expect(profile).toEqual({
        displayName: 'demo_seller · eBay US',
        settings: {
          channel: ChannelType.Ebay,
          marketplaceId: 'EBAY_US',
          currencyCode: 'USD',
          username: 'demo_seller',
          userId: USER_ID,
          businessPoliciesEnabled: true,
          policies: {
            fulfillment: [
              { id: '6000000001', name: 'Free shipping' },
              { id: '6000000002', name: 'Express' },
            ],
            payment: [{ id: '6000000101', name: 'Managed payments' }],
            return: [],
          },
        },
      });
      expect(connector.parseSettings(profile.settings)).toEqual(profile.settings);
      expect(isEbaySettings(profile.settings)).toBe(true);
      http.assertDone();
    });

    it('reports business policies as off when the account is not opted in', async () => {
      const { connector, http } = createEbayTestKit();
      const notEligible = fixtureResponse(FIXTURES, 'business-policies-not-eligible.json', 400);
      http
        .expect(HttpMethod.Get, USER_URL, fixtureResponse(FIXTURES, 'user.json'))
        .expect(HttpMethod.Get, POLICY_URLS.fulfillment, notEligible)
        .expect(HttpMethod.Get, POLICY_URLS.payment, notEligible)
        .expect(HttpMethod.Get, POLICY_URLS.return, notEligible);

      const { settings } = await connector.describeAccount(fakeChannelSession(ACCOUNT_ID));

      expect(settings).toMatchObject({
        businessPoliciesEnabled: false,
        policies: { fulfillment: [], payment: [], return: [] },
      });
    });

    it.each([
      [401, ChannelErrorCode.CredentialsRejected],
      [429, ChannelErrorCode.RateLimited],
      [503, ChannelErrorCode.ChannelUnavailable],
      [404, ChannelErrorCode.RequestRejected],
    ])('maps a %i from eBay to %s without leaking the body', async (status, code) => {
      const { connector, http } = createEbayTestKit();
      http.expect(HttpMethod.Get, USER_URL, jsonResponse({ secret: 'secret-detail' }, status));
      expectPolicies(http);

      const error = await connector
        .describeAccount(fakeChannelSession(ACCOUNT_ID, 'secret-token'))
        .catch((caught: unknown) => caught);

      expect(error).toMatchObject({ channel: ChannelType.Ebay, code });
      expect(String(error)).not.toMatch(/secret-detail|secret-token/);
    });

    it('treats an unreadable answer or a network failure as eBay being unavailable', async () => {
      const { connector, http } = createEbayTestKit();
      http.expect(HttpMethod.Get, USER_URL, jsonResponse('<html>'));
      expectPolicies(http);
      await expect(connector.describeAccount(fakeChannelSession(ACCOUNT_ID))).rejects.toMatchObject(
        { code: ChannelErrorCode.ChannelUnavailable },
      );

      const offline = createEbayTestKit();
      offline.http.expect(HttpMethod.Get, USER_URL, new Error('ECONNRESET'));
      expectPolicies(offline.http);
      await expect(
        offline.connector.describeAccount(fakeChannelSession(ACCOUNT_ID)),
      ).rejects.toMatchObject({ code: ChannelErrorCode.ChannelUnavailable });
    });

    it('refuses a session that does not name an eBay account', async () => {
      const { connector } = createEbayTestKit();

      await expect(
        connector.describeAccount(fakeChannelSession('demo-store.myshopify.com')),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
    });
  });

  it('refreshes credentials and treats revoking access as a no-op', async () => {
    const { connector, http } = createEbayTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const refreshed = await connector.refreshCredentials(ACCOUNT_ID, {
      accessToken: 'old',
      refreshToken: 'stored-refresh',
    });

    expect(refreshed.accessToken).toBe('v^1.1#i^1#fixture_refreshed_token');
    expect(refreshed.refreshToken).toBe('stored-refresh');
    await expect(connector.revokeAccess(fakeChannelSession(ACCOUNT_ID))).resolves.toBeUndefined();
    expect(http.requests).toHaveLength(1);
  });

  it('rejects settings of another channel or with unknown fields', () => {
    const { connector } = createEbayTestKit();

    expect(() => connector.parseSettings({ channel: ChannelType.Shopify })).toThrow(Error);
  });
});
