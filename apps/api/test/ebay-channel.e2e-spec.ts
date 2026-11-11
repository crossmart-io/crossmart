import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  FakeHttpTransport,
  HttpMethod,
  HttpTransport,
  jsonResponse,
} from '@crossmart/connectors';
import { ActivityAction, ConnectFailure } from '@crossmart/core';
import { ChannelConnectionStatus, PrismaService } from '@crossmart/database';
import { connectFailureRedirect, readConnectedRedirect } from './support/connect-redirect.js';
import { browserCookies, createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// Set before the app module loads its configuration. The values are fakes for this test only.
const env = vi.hoisted(() => {
  const values = {
    EBAY_CLIENT_ID: 'e2e-ebay-app-id',
    EBAY_CLIENT_SECRET: 'e2e-ebay-cert-id',
    EBAY_RU_NAME: 'E2E_Seller-E2EApp-SBX-abcdef',
    EBAY_ENVIRONMENT: 'sandbox',
    API_PUBLIC_URL: 'http://localhost:3008',
    WEB_APP_URL: 'http://localhost:5181',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  };
  Object.assign(process.env, values);
  return values;
});

const ACCESS_TOKEN = 'v^1.1#i^1#e2e_access_token';
const REFRESH_TOKEN = 'v^1.1#i^1#e2e_refresh_token';
const TOKEN_URL = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token';
const USER_URL = 'https://apiz.sandbox.ebay.com/commerce/identity/v1/user/';
const POLICY_URL =
  /^https:\/\/api\.sandbox\.ebay\.com\/sell\/account\/v1\/\w+_policy\?marketplace_id=EBAY_GB$/;
const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account',
  'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
  'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
];

interface EbayConnectionBody {
  id: string;
  channel: ChannelType;
  externalAccountId: string;
  displayName: string;
  status: ChannelConnectionStatus;
  shopify: unknown;
  ebay: {
    marketplaceId: string;
    currencyCode: string;
    username: string;
    businessPoliciesEnabled: boolean;
  } | null;
}

describe('eBay channel (e2e)', () => {
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
      .send({ channel: ChannelType.Ebay, accountHandle });
  }

  function expectEbayCalls(userId: string): void {
    http
      .expect(
        HttpMethod.Post,
        TOKEN_URL,
        jsonResponse({
          access_token: ACCESS_TOKEN,
          expires_in: 7200,
          refresh_token: REFRESH_TOKEN,
          refresh_token_expires_in: 47_304_000,
          token_type: 'User Access Token',
        }),
      )
      .expect(HttpMethod.Get, USER_URL, jsonResponse({ userId, username: 'e2e_seller' }));
    // Called again by describeAccount, alongside the policy reads.
    http.expect(HttpMethod.Get, USER_URL, jsonResponse({ userId, username: 'e2e_seller' }));
    const notEligible = jsonResponse(
      { errors: [{ errorId: 20403, message: 'Not eligible' }] },
      400,
    );
    for (let call = 0; call < 3; call += 1) {
      http.expect(HttpMethod.Get, POLICY_URL, notEligible);
    }
  }

  it('starts a sign-in with the RuName, the scopes and a signed state', async () => {
    const owner = await signUp(app, 'eBay Seller');

    const response = await startAuthorization(owner, 'ebay_gb');

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body.accountHandle).toBe('EBAY_GB');
    const url = new URL(response.body.authorizationUrl);
    expect(`${url.origin}${url.pathname}`).toBe('https://auth.sandbox.ebay.com/oauth2/authorize');
    expect(url.searchParams.get('client_id')).toBe(env.EBAY_CLIENT_ID);
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('redirect_uri')).toBe(env.EBAY_RU_NAME);
    expect(url.searchParams.get('scope')?.split(' ')).toEqual(SCOPES);
    expect(url.searchParams.get('state')).toMatch(/^[\w-]+\.[\w-]+$/);
  });

  it('refuses marketplaces Crossmart does not support', async () => {
    const owner = await signUp(app, 'Far Seller');

    for (const handle of ['EBAY_JP', 'demo.myshopify.com']) {
      expect((await startAuthorization(owner, handle)).status).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('completes the sign-in and stores the account on its marketplace', async () => {
    const owner = await signUp(app, 'Connected Seller');
    const started = await startAuthorization(owner, 'EBAY_GB');
    const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
    expectEbayCalls('e2eUser1');

    const response = await request(app.getHttpServer())
      .get('/api/v1/channels/ebay/oauth/callback')
      .query({ code: 'v^1.1#code', state, expires_in: '299' })
      .set('Cookie', browserCookies(owner, started));

    const redirect = readConnectedRedirect(
      response.headers.location,
      env.WEB_APP_URL,
      ChannelType.Ebay,
    );
    expect(redirect.reconnected).toBe(false);
    http.assertDone();
    const list = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/channel-connections`)
      .set('Cookie', owner.cookie);
    const [connection] = list.body as EbayConnectionBody[];
    expect(connection).toMatchObject({
      id: redirect.connectionId,
      channel: ChannelType.Ebay,
      externalAccountId: 'e2eUser1:EBAY_GB',
      displayName: 'e2e_seller · eBay UK',
      status: ChannelConnectionStatus.CONNECTED,
      shopify: null,
      ebay: {
        marketplaceId: 'EBAY_GB',
        currencyCode: 'GBP',
        username: 'e2e_seller',
        businessPoliciesEnabled: false,
      },
    });
    expect(list.text).not.toContain(ACCESS_TOKEN);
    expect(list.text).not.toContain(REFRESH_TOKEN);
    const stored = await app
      .get(PrismaService)
      .channelConnection.findUniqueOrThrow({ where: { id: connection.id } });
    expect(stored.credentials).not.toContain(ACCESS_TOKEN);
    const activity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', owner.cookie);
    expect(activity.body.items[0]).toMatchObject({ action: ActivityAction.ChannelConnected });
  });

  it('redirects with access_denied when the seller declines', async () => {
    const owner = await signUp(app, 'Declining Seller');
    const started = await startAuthorization(owner, 'EBAY_US');
    const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';

    const response = await request(app.getHttpServer())
      .get('/api/v1/channels/ebay/oauth/callback')
      .query({ state })
      .set('Cookie', browserCookies(owner, started));

    expect(response.headers.location).toBe(
      connectFailureRedirect(env.WEB_APP_URL, ConnectFailure.AccessDenied, ChannelType.Ebay),
    );
    http.assertDone();
  });
});
