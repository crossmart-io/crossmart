import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  ChannelFeature,
  ChannelType,
  FakeHttpTransport,
  HttpMethod,
  HttpTransport,
  jsonResponse,
} from '@crossmart/connectors';
import { ActivityAction, ConnectFailure, OAuthStateSigner } from '@crossmart/core';
import { ChannelConnectionStatus, PrismaService, WorkspaceRole } from '@crossmart/database';
import { browserCookies, createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// Set before the app module loads its configuration. The values are fakes for this test only.
const env = vi.hoisted(() => {
  const values = {
    SHOPIFY_CLIENT_ID: 'e2e-client-id',
    SHOPIFY_CLIENT_SECRET: 'e2e-client-secret',
    API_PUBLIC_URL: 'http://localhost:3004',
    WEB_APP_URL: 'http://localhost:5177',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  };
  Object.assign(process.env, values);
  return values;
});

const ACCESS_TOKEN = 'shpat_e2e_access_token';
const REFRESH_TOKEN = 'shprt_e2e_refresh_token';

interface ConnectionBody {
  id: string;
  channel: ChannelType;
  externalAccountId: string;
  displayName: string;
  status: ChannelConnectionStatus;
  shopify: {
    shopName: string;
    currencyCode: string;
    primaryLocation: { id: string } | null;
  } | null;
}

function newShop(): string {
  return `e2e-${randomUUID().slice(0, 8)}.myshopify.com`;
}

function signQuery(
  query: Record<string, string>,
  secret = env.SHOPIFY_CLIENT_SECRET,
): Record<string, string> {
  const message = Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('&');
  return { ...query, hmac: createHmac('sha256', secret).update(message).digest('hex') };
}

describe('Channels (e2e)', () => {
  let app: INestApplication<App>;
  const http = new FakeHttpTransport();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(HttpTransport).useValue(http));
  });

  afterAll(async () => {
    await app.close();
  });

  function startAuthorization(user: SignedUpUser, accountHandle: string) {
    return request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/channel-connections/authorizations`)
      .set('Cookie', user.cookie)
      .send({ channel: ChannelType.Shopify, accountHandle });
  }

  function expectShopifyCalls(shop: string): void {
    http
      .expect(
        HttpMethod.Post,
        `https://${shop}/admin/oauth/access_token`,
        jsonResponse({
          access_token: ACCESS_TOKEN,
          refresh_token: REFRESH_TOKEN,
          expires_in: 3600,
          refresh_token_expires_in: 7_776_000,
          scope: 'write_products,write_inventory,read_locations',
        }),
      )
      .expect(
        HttpMethod.Post,
        `https://${shop}/admin/api/2026-10/graphql.json`,
        jsonResponse({
          data: {
            shop: {
              name: 'E2E Store',
              myshopifyDomain: shop,
              currencyCode: 'USD',
              ianaTimezone: null,
              primaryDomain: null,
            },
            location: { id: 'gid://shopify/Location/1', name: 'Shop location' },
          },
        }),
      );
  }

  function callback(query: Record<string, string>, cookie?: string) {
    const call = request(app.getHttpServer())
      .get('/api/v1/channels/shopify/oauth/callback')
      .query(query);
    return cookie ? call.set('Cookie', cookie) : call;
  }

  async function connect(user: SignedUpUser, shop = newShop()): Promise<ConnectionBody> {
    const started = await startAuthorization(user, shop);
    const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
    expectShopifyCalls(shop);
    const response = await callback(
      signQuery({ code: 'code', shop, state, timestamp: '1762164000' }),
      browserCookies(user, started),
    );
    expect(response.headers.location).toBe(`${env.WEB_APP_URL}/channels?connected=shopify`);
    const list = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/channel-connections`)
      .set('Cookie', user.cookie);
    return list.body.find((connection: ConnectionBody) => connection.externalAccountId === shop);
  }

  function errorRedirect(failure: ConnectFailure): string {
    return `${env.WEB_APP_URL}/channels?error=${failure}&channel=shopify`;
  }

  it('starts an install with a signed state and the API callback as redirect', async () => {
    const owner = await signUp(app, 'Shop Owner');

    const response = await startAuthorization(owner, 'My-Store');

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.accountHandle).toBe('my-store.myshopify.com');
    expect(response.body.externalAccountId).toBe('my-store.myshopify.com');
    const url = new URL(response.body.authorizationUrl);
    expect(`${url.origin}${url.pathname}`).toBe(
      'https://my-store.myshopify.com/admin/oauth/authorize',
    );
    expect(url.searchParams.get('client_id')).toBe(env.SHOPIFY_CLIENT_ID);
    expect(url.searchParams.get('scope')).toBe(
      'read_products,write_products,read_inventory,write_inventory,read_locations,write_publications,read_orders',
    );
    expect(url.searchParams.get('redirect_uri')).toBe(
      'http://localhost:3004/api/v1/channels/shopify/oauth/callback',
    );
    expect(url.searchParams.get('state')).toBeTruthy();
  });

  it('rejects invalid shop domains and callers who cannot manage the workspace', async () => {
    const owner = await signUp(app, 'Careful Owner');
    expect((await startAuthorization(owner, 'evil.example.com')).status).toBe(
      HttpStatus.BAD_REQUEST,
    );

    const viewerKey = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'read only', role: WorkspaceRole.VIEWER });
    const asViewer = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/channel-connections/authorizations`)
      .set(API_KEY_HEADER, viewerKey.body.secret)
      .send({ channel: ChannelType.Shopify, accountHandle: 'demo' });
    expect(asViewer.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('completes the install, stores the token sealed and never returns credentials', async () => {
    const owner = await signUp(app, 'Connector');

    const connection = await connect(owner);

    expect(connection).toMatchObject({
      channel: ChannelType.Shopify,
      displayName: 'E2E Store',
      status: ChannelConnectionStatus.CONNECTED,
      shopify: {
        shopName: 'E2E Store',
        currencyCode: 'USD',
        primaryLocation: { id: 'gid://shopify/Location/1' },
      },
      // The fake store grants no `write_publications`, as stores connected before it did.
      missingFeatures: [ChannelFeature.StorefrontVisibility, ChannelFeature.OrderSync],
    });
    const single = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/channel-connections/${connection.id}`)
      .set('Cookie', owner.cookie);
    const stored = await app
      .get(PrismaService)
      .channelConnection.findUniqueOrThrow({ where: { id: connection.id } });
    for (const body of [JSON.stringify(connection), single.text]) {
      expect(body).not.toContain(ACCESS_TOKEN);
      expect(body).not.toContain(REFRESH_TOKEN);
      expect(body).not.toContain('credentials');
    }
    expect(stored.credentials).toMatch(/^v1\./);
    expect(stored.credentials).not.toContain(ACCESS_TOKEN);
    const activity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', owner.cookie);
    expect(activity.body.items[0]).toMatchObject({
      action: ActivityAction.ChannelConnected,
      summary: 'Connected Shopify “E2E Store”',
    });
  });

  it('keeps each workspace’s connections to itself', async () => {
    const owner = await signUp(app, 'Isolated Owner');
    const outsider = await signUp(app, 'Outsider');
    const connection = await connect(owner);

    const outsiderList = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${outsider.workspaceId}/channel-connections`)
      .set('Cookie', outsider.cookie);
    expect(outsiderList.body).toEqual([]);
    for (const path of [
      `/api/v1/workspaces/${owner.workspaceId}/channel-connections`,
      `/api/v1/workspaces/${outsider.workspaceId}/channel-connections/${connection.id}`,
    ]) {
      expect(
        (await request(app.getHttpServer()).get(path).set('Cookie', outsider.cookie)).status,
      ).toBe(HttpStatus.NOT_FOUND);
    }
    const disconnect = await request(app.getHttpServer())
      .post(
        `/api/v1/workspaces/${outsider.workspaceId}/channel-connections/${connection.id}/disconnect`,
      )
      .set('Cookie', outsider.cookie);
    expect(disconnect.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('redirects with an error for a bad callback HMAC, and records the failure', async () => {
    const owner = await signUp(app, 'Tampered');
    const shop = newShop();
    const started = await startAuthorization(owner, shop);
    const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';

    const response = await callback(
      signQuery({ code: 'code', shop, state, timestamp: '1' }, 'wrong-secret'),
      browserCookies(owner, started),
    );

    expect(response.status).toBe(HttpStatus.FOUND);
    expect(response.headers.location).toBe(errorRedirect(ConnectFailure.InvalidSignature));
    const activity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', owner.cookie);
    expect(activity.body.items[0]).toMatchObject({
      action: ActivityAction.ChannelConnectFailed,
      outcome: 'FAILED',
    });
  });

  it('refuses a signed callback for another store than the one being connected', async () => {
    const owner = await signUp(app, 'Switched Store');
    const started = await startAuthorization(owner, newShop());
    const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';

    const response = await callback(
      signQuery({ code: 'code', shop: newShop(), state, timestamp: '1' }),
      browserCookies(owner, started),
    );

    expect(response.headers.location).toBe(errorRedirect(ConnectFailure.InvalidAccount));
    http.assertDone();
  });

  it('rejects expired, forged and other users’ states', async () => {
    const owner = await signUp(app, 'Slow Merchant');
    const other = await signUp(app, 'Other User');
    const shop = newShop();
    const claims = {
      workspaceId: owner.workspaceId,
      userId: randomUUID(),
      channel: ChannelType.Shopify,
      accountHandle: shop,
    };
    const signer = app.get(OAuthStateSigner, { strict: false });
    const expired = signer.sign(claims, new Date(Date.now() - 11 * 60_000));
    const started = await startAuthorization(owner, shop);
    const ownersState = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';

    const cases: [string, string | undefined, ConnectFailure][] = [
      [expired, undefined, ConnectFailure.ExpiredState],
      [`${randomBytes(8).toString('hex')}.forged`, undefined, ConnectFailure.InvalidState],
      [ownersState, other.cookie, ConnectFailure.InvalidState],
    ];
    for (const [state, cookie, failure] of cases) {
      const response = await callback(
        signQuery({ code: 'code', shop, state, timestamp: '1' }),
        cookie,
      );
      expect(response.headers.location).toBe(errorRedirect(failure));
    }
    http.assertDone();
  });

  describe('browser binding', () => {
    async function started(owner: SignedUpUser, shop: string) {
      const response = await startAuthorization(owner, shop);
      const state = new URL(response.body.authorizationUrl).searchParams.get('state') ?? '';
      return { response, query: signQuery({ code: 'code', shop, state, timestamp: '1' }) };
    }

    it('sets an HttpOnly, SameSite=Lax nonce cookie for the callback only', async () => {
      const owner = await signUp(app, 'Cookie Merchant');
      const { response } = await started(owner, newShop());

      const [cookie] = [response.headers['set-cookie'] ?? []].flat() as string[];
      expect(cookie).toMatch(/^crossmart_oauth_nonce=[\w-]+;/);
      expect(cookie).toContain('Path=/api/v1/channels/shopify/oauth/callback');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Max-Age=600');
      expect(response.body).not.toHaveProperty('browserNonce');
    });

    it('refuses a callback without a session, even with the nonce cookie', async () => {
      const owner = await signUp(app, 'Victim Merchant');
      const shop = newShop();
      const { response, query } = await started(owner, shop);
      const nonceOnly = browserCookies({ ...owner, cookie: '' }, response);

      const callbackResponse = await callback(query, nonceOnly);

      expect(callbackResponse.headers.location).toBe(errorRedirect(ConnectFailure.SessionRequired));
      http.assertDone();
    });

    it('refuses a callback without the nonce cookie or with another browser’s', async () => {
      const owner = await signUp(app, 'Attacker');
      const shop = newShop();
      const { query } = await started(owner, shop);
      const other = await started(owner, shop);

      for (const cookie of [owner.cookie, browserCookies(owner, other.response)]) {
        expect((await callback(query, cookie)).headers.location).toBe(
          errorRedirect(ConnectFailure.InvalidState),
        );
      }
      http.assertDone();
    });

    it('connects the same browser once, clears the cookie, and refuses a replay', async () => {
      const owner = await signUp(app, 'Single Use');
      const shop = newShop();
      const { response, query } = await started(owner, shop);
      const cookies = browserCookies(owner, response);
      expectShopifyCalls(shop);

      const first = await callback(query, cookies);
      const replay = await callback(query, cookies);

      expect(first.headers.location).toBe(`${env.WEB_APP_URL}/channels?connected=shopify`);
      expect([first.headers['set-cookie']].flat().join()).toMatch(
        /^crossmart_oauth_nonce=;.*Expires=Thu, 01 Jan 1970/,
      );
      expect(replay.headers.location).toBe(errorRedirect(ConnectFailure.InvalidState));
      http.assertDone();
    });
  });

  describe('webhooks', () => {
    function deliver(
      topic: string,
      shop: string,
      body: object,
      secret = env.SHOPIFY_CLIENT_SECRET,
    ) {
      const raw = JSON.stringify(body);
      return request(app.getHttpServer())
        .post('/api/v1/webhooks/shopify')
        .set('Content-Type', 'application/json')
        .set('X-Shopify-Topic', topic)
        .set('X-Shopify-Shop-Domain', shop)
        .set('X-Shopify-Webhook-Id', randomUUID())
        .set('X-Shopify-Hmac-Sha256', createHmac('sha256', secret).update(raw).digest('base64'))
        .send(raw);
    }

    it('401s a delivery with a bad HMAC', async () => {
      const response = await deliver('app/uninstalled', newShop(), { id: 1 }, 'wrong-secret');

      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    });

    it('disconnects and wipes credentials when the app is uninstalled', async () => {
      const owner = await signUp(app, 'Uninstaller');
      const connection = await connect(owner);

      const response = await deliver('app/uninstalled', connection.externalAccountId, { id: 1 });

      expect(response.status).toBe(HttpStatus.OK);
      const stored = await app
        .get(PrismaService)
        .channelConnection.findUniqueOrThrow({ where: { id: connection.id } });
      expect(stored.status).toBe(ChannelConnectionStatus.DISCONNECTED);
      expect(stored.credentials).toBeNull();
    });

    it('acknowledges compliance topics and erases store data on shop/redact', async () => {
      const owner = await signUp(app, 'Privacy');
      const connection = await connect(owner);
      const shop = connection.externalAccountId;

      for (const topic of [
        'customers/data_request',
        'customers/redact',
        'shop/redact',
        'products/update',
      ]) {
        expect((await deliver(topic, shop, { shop_domain: shop })).status).toBe(HttpStatus.OK);
      }
      const stored = await app
        .get(PrismaService)
        .channelConnection.findUniqueOrThrow({ where: { id: connection.id } });
      expect(stored).toMatchObject({ credentials: null, settings: {}, grantedScopes: [] });
    });
  });

  it('disconnects by uninstalling the app and wiping the credentials', async () => {
    const owner = await signUp(app, 'Leaver');
    const connection = await connect(owner);
    http.expect(
      HttpMethod.Post,
      `https://${connection.externalAccountId}/admin/api/2026-10/graphql.json`,
      (sent) => {
        expect(sent.headers?.['x-shopify-access-token']).toBe(ACCESS_TOKEN);
        return jsonResponse({ data: { appUninstall: { userErrors: [] } } });
      },
    );

    const response = await request(app.getHttpServer())
      .post(
        `/api/v1/workspaces/${owner.workspaceId}/channel-connections/${connection.id}/disconnect`,
      )
      .set('Cookie', owner.cookie);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.status).toBe(ChannelConnectionStatus.DISCONNECTED);
    http.assertDone();
    const stored = await app
      .get(PrismaService)
      .channelConnection.findUniqueOrThrow({ where: { id: connection.id } });
    expect(stored.credentials).toBeNull();
  });
});
