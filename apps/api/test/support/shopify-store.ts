import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  type FakeHttpTransport,
  HttpMethod,
  type HttpRequest,
  type HttpResponse,
  jsonResponse,
} from '@crossmart/connectors';
import type { SignedUpUser } from './test-app.js';

/** Fake app settings, set before the app module reads its configuration. */
export const SHOPIFY_TEST_ENV = {
  SHOPIFY_CLIENT_ID: 'e2e-client-id',
  SHOPIFY_CLIENT_SECRET: 'e2e-client-secret',
  API_PUBLIC_URL: 'http://localhost:3006',
  WEB_APP_URL: 'http://localhost:5179',
  CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
    'base64',
  ),
};

/** Fabricated tokens; tests check that they never reach a response. */
export const SHOPIFY_ACCESS_TOKEN = 'shpat_e2e_access_token';
export const SHOPIFY_REFRESH_TOKEN = 'shprt_e2e_refresh_token';

export const TEST_LOCATION = 'gid://shopify/Location/1';

/** The connector's recorded catalog fixtures (four products over two pages). */
const CATALOG_FIXTURES = new URL(
  '../../../../libs/connectors/src/shopify/__fixtures__/',
  import.meta.url,
);
const FIXTURE_ENCODING = 'utf8';

export interface GraphqlCall {
  query: string;
  variables: Record<string, unknown>;
}

export function newShop(): string {
  return `e2e-${randomUUID().slice(0, 8)}.myshopify.com`;
}

export function graphqlUrl(shop: string): string {
  return `https://${shop}/admin/api/2026-10/graphql.json`;
}

export function graphqlCall(httpRequest: HttpRequest): GraphqlCall {
  return JSON.parse(httpRequest.body ?? '{}') as GraphqlCall;
}

function fixture(name: string): string {
  return readFileSync(new URL(name, CATALOG_FIXTURES), FIXTURE_ENCODING);
}

export function signQuery(query: Record<string, string>): Record<string, string> {
  const message = Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('&');
  const hmac = createHmac('sha256', SHOPIFY_TEST_ENV.SHOPIFY_CLIENT_SECRET).update(message);
  return { ...query, hmac: hmac.digest('hex') };
}

/** Answers every GraphQL call to the store with `respond`, for as many calls as `times`. */
export function answerGraphql(
  http: FakeHttpTransport,
  shop: string,
  respond: (call: GraphqlCall) => unknown,
  times = 1,
): void {
  for (let call = 0; call < times; call += 1) {
    http.expect(HttpMethod.Post, graphqlUrl(shop), (httpRequest): HttpResponse =>
      jsonResponse(respond(graphqlCall(httpRequest))),
    );
  }
}

/** What the fake store grants: the required scopes, without the optional ones. */
export const DEFAULT_GRANTED_SCOPES = 'write_products,write_inventory,read_locations';
/** Granted by stores that approved reading orders. */
export const ORDER_GRANTED_SCOPES = `${DEFAULT_GRANTED_SCOPES},read_orders`;

export function expectTokenExchange(http: FakeHttpTransport, shop: string, scope: string): void {
  http.expect(
    HttpMethod.Post,
    `https://${shop}/admin/oauth/access_token`,
    jsonResponse({
      access_token: SHOPIFY_ACCESS_TOKEN,
      refresh_token: SHOPIFY_REFRESH_TOKEN,
      expires_in: 3600,
      refresh_token_expires_in: 7_776_000,
      scope,
    }),
  );
}

function expectShopDetails(http: FakeHttpTransport, shop: string): void {
  answerGraphql(http, shop, () => ({
    data: {
      shop: {
        name: 'E2E Store',
        myshopifyDomain: shop,
        currencyCode: 'USD',
        ianaTimezone: null,
        primaryDomain: null,
      },
      location: { id: TEST_LOCATION, name: 'Shop location' },
    },
  }));
}

/** Connects a fake store to the user's workspace through the real OAuth flow; returns its id. */
export async function connectShopifyStore(
  app: INestApplication<App>,
  http: FakeHttpTransport,
  user: SignedUpUser,
  store: string | { shop?: string; scope?: string } = {},
): Promise<string> {
  const { shop = newShop(), scope = DEFAULT_GRANTED_SCOPES } =
    typeof store === 'string' ? { shop: store } : store;
  const server = app.getHttpServer();
  const started = await request(server)
    .post(`/api/v1/workspaces/${user.workspaceId}/channel-connections/authorizations`)
    .set('Cookie', user.cookie)
    .send({ channel: ChannelType.Shopify, accountHandle: shop });
  const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
  expectTokenExchange(http, shop, scope);
  expectShopDetails(http, shop);
  await request(server)
    .get('/api/v1/channels/shopify/oauth/callback')
    .query(signQuery({ code: 'code', shop, state, timestamp: '1762164000' }))
    .set('Cookie', user.cookie);
  const list = await request(server)
    .get(`/api/v1/workspaces/${user.workspaceId}/channel-connections`)
    .set('Cookie', user.cookie);
  expect(list.status).toBe(HttpStatus.OK);
  const connection = (list.body as { id: string; externalAccountId: string }[]).find(
    (entry) => entry.externalAccountId === shop,
  );
  if (!connection) throw new Error(`The store ${shop} was not connected`);
  return connection.id;
}

/** Answers one catalog read call by the operation it runs, from the recorded fixtures. */
function catalogResponder(httpRequest: HttpRequest): HttpResponse {
  const call = graphqlCall(httpRequest);
  if (call.query.includes('query PrimaryLocation')) {
    return jsonResponse(fixture('primary-location.json'));
  }
  if (call.query.includes('query ProductVariants')) {
    return jsonResponse(fixture('product-variants.json'));
  }
  return jsonResponse(
    fixture(call.variables.after ? 'catalog-products-page-2.json' : 'catalog-products-page-1.json'),
  );
}

/** Serves one full read of the catalog: two pages and the follow-up variant page. */
export function serveShopifyCatalog(http: FakeHttpTransport, shop: string): void {
  const calls = ['location', 'page-1', 'variants', 'location', 'page-2'];
  for (const _call of calls) {
    http.expect(HttpMethod.Post, graphqlUrl(shop), catalogResponder);
  }
}
