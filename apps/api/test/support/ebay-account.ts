import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  type FakeHttpTransport,
  HttpMethod,
  jsonResponse,
} from '@crossmart/connectors';
import type { SignedUpUser } from './test-app.js';

/** Fake app settings, set before the app module reads its configuration. */
export const EBAY_TEST_ENV = {
  EBAY_CLIENT_ID: 'e2e-ebay-app-id',
  EBAY_CLIENT_SECRET: 'e2e-ebay-cert-id',
  EBAY_RU_NAME: 'E2E_Seller-E2EApp-SBX-abcdef',
  EBAY_ENVIRONMENT: 'sandbox',
  API_PUBLIC_URL: 'http://localhost:3009',
  WEB_APP_URL: 'http://localhost:5182',
  CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
    'base64',
  ),
};

export const EBAY_API = 'https://api.sandbox.ebay.com';
export const EBAY_INVENTORY = `${EBAY_API}/sell/inventory/v1`;
const TOKEN_URL = `${EBAY_API}/identity/v1/oauth2/token`;
const USER_URL = 'https://apiz.sandbox.ebay.com/commerce/identity/v1/user/';
const POLICY_BASE = `${EBAY_API}/sell/account/v1`;

/** One business policy of each type, as eBay lists them. */
export function expectEbayPolicies(http: FakeHttpTransport): void {
  http
    .expect(
      HttpMethod.Get,
      `${POLICY_BASE}/fulfillment_policy?marketplace_id=EBAY_US`,
      jsonResponse({ fulfillmentPolicies: [{ fulfillmentPolicyId: 'f-1', name: 'Free' }] }),
    )
    .expect(
      HttpMethod.Get,
      `${POLICY_BASE}/payment_policy?marketplace_id=EBAY_US`,
      jsonResponse({ paymentPolicies: [{ paymentPolicyId: 'p-1', name: 'Managed' }] }),
    )
    .expect(
      HttpMethod.Get,
      `${POLICY_BASE}/return_policy?marketplace_id=EBAY_US`,
      jsonResponse({ returnPolicies: [{ returnPolicyId: 'r-1', name: '30 days' }] }),
    );
}

/** An account that has not opted in to business policies. */
export function expectNoEbayPolicies(http: FakeHttpTransport): void {
  const notEligible = jsonResponse({ errors: [{ errorId: 20403, message: 'Not eligible' }] }, 400);
  for (const type of ['fulfillment', 'payment', 'return']) {
    http.expect(
      HttpMethod.Get,
      `${POLICY_BASE}/${type}_policy?marketplace_id=EBAY_US`,
      notEligible,
    );
  }
}

export function expectEbayUser(http: FakeHttpTransport, userId: string): void {
  http.expect(HttpMethod.Get, USER_URL, jsonResponse({ userId, username: `${userId}_seller` }));
}

/**
 * Connects an eBay US account through the OAuth callback, answering eBay's calls with fakes;
 * `withPolicies` says whether the account has opted in to business policies.
 */
export async function connectEbayAccount(
  app: INestApplication<App>,
  http: FakeHttpTransport,
  user: SignedUpUser,
  options: { userId: string; withPolicies: boolean },
): Promise<string> {
  const base = `/api/v1/workspaces/${user.workspaceId}/channel-connections`;
  const started = await request(app.getHttpServer())
    .post(`${base}/authorizations`)
    .set('Cookie', user.cookie)
    .send({ channel: ChannelType.Ebay, accountHandle: 'EBAY_US' });
  const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
  http.expect(
    HttpMethod.Post,
    TOKEN_URL,
    jsonResponse({
      access_token: 'v^1.1#e2e_access',
      expires_in: 7200,
      refresh_token: 'v^1.1#e2e_refresh',
      refresh_token_expires_in: 47_304_000,
      token_type: 'User Access Token',
    }),
  );
  expectEbayUser(http, options.userId);
  expectEbayUser(http, options.userId);
  if (options.withPolicies) expectEbayPolicies(http);
  else expectNoEbayPolicies(http);
  const callback = await request(app.getHttpServer())
    .get('/api/v1/channels/ebay/oauth/callback')
    .query({ code: 'v^1.1#code', state })
    .set('Cookie', user.cookie);
  expect(callback.headers.location).toBe(`${EBAY_TEST_ENV.WEB_APP_URL}/channels?connected=ebay`);
  http.assertDone();
  const list = await request(app.getHttpServer()).get(base).set('Cookie', user.cookie);
  expect(list.status).toBe(HttpStatus.OK);
  return (list.body as { id: string }[])[0].id;
}
