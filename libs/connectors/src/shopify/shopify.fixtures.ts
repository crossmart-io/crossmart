import { createHmac } from 'node:crypto';
import { RecordingSleeper } from '../sdk/time/sleeper.js';
import { FakeHttpTransport } from '../sdk/testing/fake-http-transport.js';
import { ShopifyCatalogReader } from './catalog/shopify-catalog.reader.js';
import { ShopifyAdminClient } from './graphql/shopify-admin.client.js';
import { ShopifyInventorySync } from './inventory/shopify-inventory-sync.js';
import { ShopifyOnlineStore } from './publish/shopify-online-store.js';
import { ShopifyLocations } from './inventory/shopify-locations.js';
import { ShopifyOAuthClient } from './oauth/shopify-oauth.client.js';
import { ShopifyListingPublisher } from './publish/shopify-listing-publisher.js';
import { ShopifyConnector } from './shopify.connector.js';
import { ShopifyApp } from './shopify-app.js';
import { ShopifyStoreCapabilities } from './shopify-store-capabilities.js';
import { ShopifySignatures } from './shopify-signatures.js';
import { ShopifyWebhookParser } from './webhooks/shopify-webhook-parser.js';

/** Fabricated responses in the shape of Admin API 2026-10; no real store, token or customer data. */
export const FIXTURES = new URL('./__fixtures__/', import.meta.url);
export const TEST_CLIENT_ID = 'test-client-id';
export const TEST_CLIENT_SECRET = 'test-client-secret';
export const SHOP = 'demo-store.myshopify.com';
export const TOKEN_URL = `https://${SHOP}/admin/oauth/access_token`;
export const GRAPHQL_URL = `https://${SHOP}/admin/api/2026-10/graphql.json`;

export interface ShopifyTestKit {
  http: FakeHttpTransport;
  sleeper: RecordingSleeper;
  oauth: ShopifyOAuthClient;
  admin: ShopifyAdminClient;
  connector: ShopifyConnector;
}

/** A connector wired to fakes, as the Nest module wires the real one. */
export function createShopifyTestKit(
  app = new ShopifyApp({ clientId: TEST_CLIENT_ID, clientSecret: TEST_CLIENT_SECRET }),
): ShopifyTestKit {
  const http = new FakeHttpTransport();
  const sleeper = new RecordingSleeper();
  const signatures = new ShopifySignatures(app);
  const oauth = new ShopifyOAuthClient(app, http, signatures);
  const admin = new ShopifyAdminClient(http, sleeper);
  const locations = new ShopifyLocations(admin);
  const connector = new ShopifyConnector(
    oauth,
    admin,
    new ShopifyWebhookParser(signatures),
    new ShopifyStoreCapabilities(
      new ShopifyCatalogReader(admin),
      new ShopifyListingPublisher(admin, locations, new ShopifyOnlineStore(admin)),
      new ShopifyInventorySync(admin, locations),
    ),
  );
  return { http, sleeper, oauth, admin, connector };
}

/** Signs a query the way Shopify signs OAuth callbacks. */
export function signShopifyQuery(
  query: Record<string, string>,
  secret = TEST_CLIENT_SECRET,
): Record<string, string> {
  const message = Object.keys(query)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(query[key] ?? '')}`)
    .join('&');
  return { ...query, hmac: createHmac('sha256', secret).update(message).digest('hex') };
}

export function signShopifyBody(body: Buffer, secret = TEST_CLIENT_SECRET): string {
  return createHmac('sha256', secret).update(body).digest('base64');
}
