import { createHmac, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  ChannelType,
  type FakeHttpTransport,
  HttpMethod,
  type HttpRequest,
  jsonResponse,
} from '@crossmart/connectors';
import type { SignedUpUser } from './test-app.js';

/** Fabricated tokens; tests check that they never reach a response. */
export const SHOPIFY_ACCESS_TOKEN = 'shpat_e2e_import_access_token';
export const SHOPIFY_REFRESH_TOKEN = 'shprt_e2e_import_refresh_token';

/** The connector's recorded catalog fixtures (four products over two pages). */
const CATALOG_FIXTURES = new URL(
  '../../../../libs/connectors/src/shopify/__fixtures__/',
  import.meta.url,
);
const FIXTURE_ENCODING = 'utf8';

interface GraphqlRequestBody {
  query: string;
  variables: { after?: string | null };
}

export function newShop(): string {
  return `e2e-${randomUUID().slice(0, 8)}.myshopify.com`;
}

function graphqlUrl(shop: string): string {
  return `https://${shop}/admin/api/2026-10/graphql.json`;
}

function fixture(name: string): string {
  return readFileSync(new URL(name, CATALOG_FIXTURES), FIXTURE_ENCODING);
}

function signQuery(query: Record<string, string>, secret: string): Record<string, string> {
  const message = Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('&');
  return { ...query, hmac: createHmac('sha256', secret).update(message).digest('hex') };
}

/** Connects a Shopify store through the real OAuth flow, against a fake Shopify. */
export async function connectShopifyStore(
  app: INestApplication<App>,
  http: FakeHttpTransport,
  user: SignedUpUser,
  options: { shop: string; clientSecret: string },
): Promise<string> {
  const { shop, clientSecret } = options;
  const started = await request(app.getHttpServer())
    .post(`/api/v1/workspaces/${user.workspaceId}/channel-connections/authorizations`)
    .set('Cookie', user.cookie)
    .send({ channel: ChannelType.Shopify, accountHandle: shop });
  const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
  http
    .expect(
      HttpMethod.Post,
      `https://${shop}/admin/oauth/access_token`,
      jsonResponse({
        access_token: SHOPIFY_ACCESS_TOKEN,
        refresh_token: SHOPIFY_REFRESH_TOKEN,
        expires_in: 3600,
        refresh_token_expires_in: 7_776_000,
        scope: 'write_products,write_inventory,read_locations',
      }),
    )
    .expect(HttpMethod.Post, graphqlUrl(shop), jsonResponse(JSON.parse(fixture('shop.json'))));
  await request(app.getHttpServer())
    .get('/api/v1/channels/shopify/oauth/callback')
    .query(signQuery({ code: 'code', shop, state, timestamp: '1762164000' }, clientSecret))
    .set('Cookie', user.cookie);
  const list = await request(app.getHttpServer())
    .get(`/api/v1/workspaces/${user.workspaceId}/channel-connections`)
    .set('Cookie', user.cookie);
  return list.body.find(
    (connection: { externalAccountId: string }) => connection.externalAccountId === shop,
  ).id;
}

/** Answers one GraphQL call by the operation it runs, from the recorded fixtures. */
function catalogResponder(request: HttpRequest) {
  const body = JSON.parse(request.body ?? '{}') as GraphqlRequestBody;
  if (body.query.includes('query PrimaryLocation')) {
    return jsonResponse(fixture('primary-location.json'));
  }
  if (body.query.includes('query ProductVariants')) {
    return jsonResponse(fixture('product-variants.json'));
  }
  return jsonResponse(
    fixture(body.variables.after ? 'catalog-products-page-2.json' : 'catalog-products-page-1.json'),
  );
}

/** Serves one full read of the catalog: two pages and the follow-up variant page. */
export function serveShopifyCatalog(http: FakeHttpTransport, shop: string): void {
  const calls = ['location', 'page-1', 'variants', 'location', 'page-2'];
  for (const _call of calls) {
    http.expect(HttpMethod.Post, graphqlUrl(shop), catalogResponder);
  }
}
