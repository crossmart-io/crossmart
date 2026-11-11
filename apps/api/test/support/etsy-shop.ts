import { createHash } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  type FakeHttpTransport,
  HttpMethod,
  jsonResponse,
} from '@crossmart/connectors';
import { readConnectedRedirect } from './connect-redirect.js';
import { browserCookies, type SignedUpUser } from './test-app.js';

export const ETSY_API = 'https://api.etsy.com/v3';
export const ETSY_SHOP_ID = '87654321';
export const ETSY_SHOP_API = `${ETSY_API}/application/shops/${ETSY_SHOP_ID}`;
const TOKEN_URL = `${ETSY_API}/public/oauth/token`;
const SCOPES = 'listings_r listings_w shops_r transactions_r';

/** The shop, its two shipping profiles and two processing profiles, as `describeAccount` reads them. */
export function expectEtsyShop(http: FakeHttpTransport): void {
  http
    .expect(HttpMethod.Get, ETSY_SHOP_API, etsyShopResponse())
    .expect(
      HttpMethod.Get,
      `${ETSY_SHOP_API}/shipping-profiles`,
      jsonResponse({
        count: 2,
        results: [
          { shipping_profile_id: 6722757781, title: 'Free US shipping', is_deleted: false },
          { shipping_profile_id: 6722757782, title: 'Express', is_deleted: false },
        ],
      }),
    )
    .expect(
      HttpMethod.Get,
      `${ETSY_SHOP_API}/readiness-state-definitions?limit=100`,
      jsonResponse({
        count: 2,
        results: [
          {
            readiness_state_id: 18201076875,
            readiness_state: 'ready_to_ship',
            min_processing_days: 1,
            max_processing_days: 3,
          },
          {
            readiness_state_id: 18201056977,
            readiness_state: 'made_to_order',
            min_processing_days: 5,
            max_processing_days: 8,
          },
        ],
      }),
    );
}

function etsyShopResponse(): ReturnType<typeof jsonResponse> {
  return jsonResponse({
    shop_id: Number(ETSY_SHOP_ID),
    user_id: 12345678,
    shop_name: 'ClayAndKiln',
    currency_code: 'USD',
    url: 'https://www.etsy.com/shop/ClayAndKiln',
    login_name: 'e2e_owner_login',
  });
}

/**
 * Connects the Etsy shop through the OAuth callback, answering Etsy with fakes. Checks that the
 * verifier sent with the code is the one whose S256 challenge the authorize URL carried.
 */
export async function connectEtsy(
  app: INestApplication<App>,
  http: FakeHttpTransport,
  user: SignedUpUser,
  webAppUrl: string,
): Promise<string> {
  const base = `/api/v1/workspaces/${user.workspaceId}/channel-connections`;
  const started = await request(app.getHttpServer())
    .post(`${base}/authorizations`)
    .set('Cookie', user.cookie)
    .send({ channel: ChannelType.Etsy, accountHandle: 'ClayAndKiln' });
  expect(started.status).toBe(HttpStatus.CREATED);
  const authorizeUrl = new URL(started.body.authorizationUrl as string);
  expect(authorizeUrl.searchParams.get('code_challenge_method')).toBe('S256');
  const challenge = authorizeUrl.searchParams.get('code_challenge');
  http
    .expect(HttpMethod.Post, TOKEN_URL, (tokenRequest) => {
      const verifier = new URLSearchParams(tokenRequest.body).get('code_verifier') ?? '';
      expect(createHash('sha256').update(verifier).digest('base64url')).toBe(challenge);
      return jsonResponse({
        access_token: '12345678.e2e_access',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: '12345678.e2e_refresh',
        scope: SCOPES,
      });
    })
    .expect(
      HttpMethod.Get,
      `${ETSY_API}/application/users/me`,
      jsonResponse({ user_id: 12345678, shop_id: Number(ETSY_SHOP_ID) }),
    )
    .expect(HttpMethod.Get, ETSY_SHOP_API, etsyShopResponse());
  expectEtsyShop(http);
  const callback = await request(app.getHttpServer())
    .get('/api/v1/channels/etsy/oauth/callback')
    .query({ code: 'e2e-code', state: authorizeUrl.searchParams.get('state') ?? '' })
    .set('Cookie', browserCookies(user, started));
  const redirect = readConnectedRedirect(callback.headers.location, webAppUrl, ChannelType.Etsy);
  http.assertDone();
  const list = await request(app.getHttpServer()).get(base).set('Cookie', user.cookie);
  expect((list.body as { id: string }[])[0].id).toBe(redirect.connectionId);
  return redirect.connectionId;
}
