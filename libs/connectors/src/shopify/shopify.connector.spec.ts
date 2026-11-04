import { ChannelWebhookKind } from '../sdk/capabilities/webhook-receiver.js';
import { ChannelType } from '../sdk/channel-type.enum.js';
import { ChannelErrorCode } from '../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../sdk/http/http-method.enum.js';
import { describeConnectorContract } from '../sdk/testing/connector-contract.js';
import { fakeChannelSession } from '../sdk/testing/fake-channel-session.js';
import { fixtureResponse, loadFixture } from '../sdk/testing/fixtures.js';
import { jsonResponse } from '../sdk/testing/fake-http-transport.js';
import { ShopifyApp } from './shopify-app.js';
import {
  createShopifyTestKit,
  FIXTURES,
  GRAPHQL_URL,
  SHOP,
  signShopifyBody,
  signShopifyQuery,
  TOKEN_URL,
} from './shopify.fixtures.js';

const REDIRECT_URI = 'http://localhost:3004/api/v1/channels/shopify/oauth/callback';
const CALLBACK = { code: 'auth-code', shop: SHOP, state: 'signed-state', timestamp: '1762164000' };

describeConnectorContract(() => createShopifyTestKit().connector, {
  validAccountHandle: 'demo-store',
  invalidAccountHandles: ['', 'demo.myshopify.com.attacker.example', 'not a store'],
});

describe('ShopifyConnector', () => {
  describe('completeAuthorization', () => {
    it('verifies the callback and exchanges its code for credentials', async () => {
      const { connector, http } = createShopifyTestKit();
      http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'access-token.json'));

      const authorization = await connector.completeAuthorization({
        query: signShopifyQuery(CALLBACK),
        redirectUri: REDIRECT_URI,
      });

      expect(authorization.externalAccountId).toBe(SHOP);
      expect(authorization.credentials.accessToken).toBe('shpat_fixture_access');
      expect(authorization.credentials.refreshToken).toBe('shprt_fixture_refresh');
    });

    it('refuses unsigned callbacks and invalid shops before calling Shopify', async () => {
      const { connector, http } = createShopifyTestKit();
      const attacker = signShopifyQuery({
        ...CALLBACK,
        shop: 'demo.myshopify.com.attacker.example',
      });

      await expect(
        connector.completeAuthorization({ query: CALLBACK, redirectUri: REDIRECT_URI }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidSignature });
      await expect(
        connector.completeAuthorization({ query: attacker, redirectUri: REDIRECT_URI }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.InvalidAccount });
      expect(http.requests).toEqual([]);
    });

    it('refuses a grant that lacks required scopes', async () => {
      const { connector, http } = createShopifyTestKit();
      http.expect(
        HttpMethod.Post,
        TOKEN_URL,
        fixtureResponse(FIXTURES, 'access-token-partial-scopes.json'),
      );

      await expect(
        connector.completeAuthorization({
          query: signShopifyQuery(CALLBACK),
          redirectUri: REDIRECT_URI,
        }),
      ).rejects.toMatchObject({ code: ChannelErrorCode.MissingScopes });
    });
  });

  it('describes the store: name, currency, timezone and primary location', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'shop.json'));

    const profile = await connector.describeAccount(fakeChannelSession(SHOP));

    expect(profile).toEqual({
      displayName: 'Demo Store',
      settings: {
        channel: ChannelType.Shopify,
        shopName: 'Demo Store',
        currencyCode: 'EUR',
        ianaTimezone: 'Europe/Berlin',
        primaryDomainUrl: 'https://shop.example.com',
        primaryLocation: { id: 'gid://shopify/Location/1001', name: 'Main warehouse' },
      },
    });
    expect(connector.parseSettings(profile.settings)).toEqual(profile.settings);
  });

  it('refreshes credentials with the stored refresh token', async () => {
    const { connector, http } = createShopifyTestKit();
    http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'refreshed-token.json'));

    const refreshed = await connector.refreshCredentials(SHOP, {
      accessToken: 'old',
      refreshToken: 'refresh',
    });

    expect(refreshed.accessToken).toBe('shpat_fixture_refreshed');
    await expect(connector.refreshCredentials(SHOP, { accessToken: 'old' })).rejects.toMatchObject({
      code: ChannelErrorCode.CredentialsRejected,
    });
  });

  it('revokes access by uninstalling the app, surfacing user errors', async () => {
    const { connector, http } = createShopifyTestKit();
    http
      .expect(HttpMethod.Post, GRAPHQL_URL, fixtureResponse(FIXTURES, 'app-uninstall.json'))
      .expect(
        HttpMethod.Post,
        GRAPHQL_URL,
        jsonResponse({ data: { appUninstall: { userErrors: [{ message: 'Not installed' }] } } }),
      );

    await connector.revokeAccess(fakeChannelSession(SHOP));
    await expect(connector.revokeAccess(fakeChannelSession(SHOP))).rejects.toMatchObject({
      code: ChannelErrorCode.RequestRejected,
    });
    expect(JSON.parse(http.requests[0].body ?? '').query).toContain('appUninstall');
  });

  describe('verifyWebhook', () => {
    const body = Buffer.from(loadFixture(FIXTURES, 'app-uninstalled-webhook.json'));
    const headers = (overrides: Record<string, string> = {}) => ({
      'x-shopify-hmac-sha256': signShopifyBody(body),
      'x-shopify-topic': 'app/uninstalled',
      'x-shopify-shop-domain': SHOP,
      'x-shopify-webhook-id': 'delivery-1',
      ...overrides,
    });

    it('parses a signed delivery into a channel-neutral event', () => {
      const { connector } = createShopifyTestKit();

      expect(connector.verifyWebhook({ rawBody: body, headers: headers() })).toMatchObject({
        kind: ChannelWebhookKind.AccountDisconnected,
        topic: 'app/uninstalled',
        externalAccountId: SHOP,
        deliveryId: 'delivery-1',
        payload: { myshopify_domain: SHOP },
      });
    });

    it.each([
      ['customers/data_request', ChannelWebhookKind.CustomerDataRequested],
      ['customers/redact', ChannelWebhookKind.CustomerRedactionRequested],
      ['shop/redact', ChannelWebhookKind.AccountRedactionRequested],
      ['orders/create', ChannelWebhookKind.OrderChanged],
      ['orders/updated', ChannelWebhookKind.OrderChanged],
      ['orders/cancelled', ChannelWebhookKind.OrderChanged],
      ['products/update', ChannelWebhookKind.Unhandled],
    ])('maps %s to %s', (topic, kind) => {
      const { connector } = createShopifyTestKit();

      expect(
        connector.verifyWebhook({ rawBody: body, headers: headers({ 'x-shopify-topic': topic }) })
          ?.kind,
      ).toBe(kind);
    });

    it('names the order an order webhook is about by its Admin GraphQL id', () => {
      const { connector } = createShopifyTestKit();
      const order = Buffer.from(loadFixture(FIXTURES, 'order-webhook.json'));

      const event = connector.verifyWebhook({
        rawBody: order,
        headers: {
          ...headers({ 'x-shopify-topic': 'orders/updated' }),
          'x-shopify-hmac-sha256': signShopifyBody(order),
        },
      });

      expect(event).toMatchObject({
        kind: ChannelWebhookKind.OrderChanged,
        resourceId: 'gid://shopify/Order/5001',
      });
    });

    it('rejects bad signatures, other secrets, and invalid shop domains', () => {
      const { connector } = createShopifyTestKit();
      const otherApp = createShopifyTestKit(
        new ShopifyApp({ clientId: 'x', clientSecret: 'other' }),
      ).connector;

      expect(
        connector.verifyWebhook({
          rawBody: body,
          headers: headers({ 'x-shopify-hmac-sha256': 'bad' }),
        }),
      ).toBeNull();
      expect(otherApp.verifyWebhook({ rawBody: body, headers: headers() })).toBeNull();
      expect(
        connector.verifyWebhook({
          rawBody: body,
          headers: headers({ 'x-shopify-shop-domain': 'evil.example' }),
        }),
      ).toBeNull();
      expect(
        connector.verifyWebhook({
          rawBody: body,
          headers: { ...headers(), 'x-shopify-topic': undefined },
        }),
      ).toBeNull();
    });
  });
});
