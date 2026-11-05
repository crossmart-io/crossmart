import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  type FakeHttpTransport,
  HttpMethod,
  jsonResponse,
} from '@crossmart/connectors';
import { browserCookies, type SignedUpUser } from './test-app.js';

export const GOOGLE_API = 'https://merchantapi.googleapis.com';
export const MERCHANT_ACCOUNT_ID = '123456789';
const ACCOUNT_URL = `${GOOGLE_API}/accounts/v1/accounts/${MERCHANT_ACCOUNT_ID}`;
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

/** The Merchant Center account, its claimed website and its business country (Germany). */
export function expectMerchantAccount(http: FakeHttpTransport): void {
  http
    .expect(
      HttpMethod.Get,
      ACCOUNT_URL,
      jsonResponse({ accountId: MERCHANT_ACCOUNT_ID, accountName: 'Acme Goods' }),
    )
    .expect(
      HttpMethod.Get,
      `${ACCOUNT_URL}/homepage`,
      jsonResponse({ uri: 'https://acme.example', claimed: true }),
    )
    .expect(
      HttpMethod.Get,
      `${ACCOUNT_URL}/businessInfo`,
      jsonResponse({ address: { regionCode: 'DE' } }),
    );
}

/** Connects a Merchant Center account through the OAuth callback, answering Google with fakes. */
export async function connectGoogleMerchant(
  app: INestApplication<App>,
  http: FakeHttpTransport,
  user: SignedUpUser,
  webAppUrl: string,
): Promise<string> {
  const base = `/api/v1/workspaces/${user.workspaceId}/channel-connections`;
  const started = await request(app.getHttpServer())
    .post(`${base}/authorizations`)
    .set('Cookie', user.cookie)
    .send({ channel: ChannelType.GoogleMerchant, accountHandle: '123-456-789' });
  expect(started.status).toBe(HttpStatus.CREATED);
  const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
  http.expect(
    HttpMethod.Post,
    TOKEN_URL,
    jsonResponse({
      access_token: 'ya29.e2e_access',
      expires_in: 3599,
      refresh_token: '1//e2e_refresh',
      scope: 'https://www.googleapis.com/auth/content',
      token_type: 'Bearer',
    }),
  );
  expectMerchantAccount(http);
  expectMerchantAccount(http);
  const callback = await request(app.getHttpServer())
    .get('/api/v1/channels/google_merchant/oauth/callback')
    .query({ code: '4/e2e-code', state, scope: 'https://www.googleapis.com/auth/content' })
    .set('Cookie', browserCookies(user, started));
  expect(callback.headers.location).toBe(`${webAppUrl}/channels?connected=google_merchant`);
  http.assertDone();
  const list = await request(app.getHttpServer()).get(base).set('Cookie', user.cookie);
  return (list.body as { id: string }[])[0].id;
}
