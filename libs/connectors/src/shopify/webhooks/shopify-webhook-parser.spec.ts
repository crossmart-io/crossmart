import { ChannelWebhookKind } from '../../sdk/capabilities/webhook-receiver.js';
import { ShopifyApp } from '../shopify-app.js';
import { SHOP, signShopifyBody, TEST_CLIENT_ID, TEST_CLIENT_SECRET } from '../shopify.fixtures.js';
import { ShopifySignatures } from '../shopify-signatures.js';
import { ShopifyWebhookParser } from './shopify-webhook-parser.js';

const NOW = Date.parse('2026-11-05T12:00:00Z');
const HOUR_MS = 60 * 60 * 1000;
const parser = new ShopifyWebhookParser(
  new ShopifySignatures(
    new ShopifyApp({ clientId: TEST_CLIENT_ID, clientSecret: TEST_CLIENT_SECRET }),
  ),
);

function delivery(topic: string, body: object, headers: Record<string, string> = {}) {
  const rawBody = Buffer.from(JSON.stringify(body));
  return {
    rawBody,
    headers: {
      'x-shopify-hmac-sha256': signShopifyBody(rawBody),
      'x-shopify-topic': topic,
      'x-shopify-shop-domain': SHOP,
      'x-shopify-webhook-id': 'delivery-1',
      'x-shopify-triggered-at': new Date(NOW - 1000).toISOString(),
      ...headers,
    },
  };
}

describe('ShopifyWebhookParser', () => {
  it.each([
    ['customers/redact', { shop_domain: SHOP, customer: { id: 1 } }],
    ['shop/redact', { shop_domain: 'DEMO-STORE.myshopify.com' }],
    ['app/uninstalled', { domain: 'shop.example.com', myshopify_domain: SHOP }],
  ])('accepts %s when the body names the header’s shop', (topic, body) => {
    expect(parser.parse(delivery(topic, body), NOW)?.externalAccountId).toBe(SHOP);
  });

  it.each([
    ['shop/redact', { shop_domain: 'victim.myshopify.com' }],
    ['customers/data_request', { customer: { id: 1 } }],
    ['app/uninstalled', { domain: SHOP, myshopify_domain: 'victim.myshopify.com' }],
  ])('refuses %s whose body names another shop, or none', (topic, body) => {
    expect(parser.parse(delivery(topic, body), NOW)).toBeNull();
  });

  it('does not require the body to name the shop for order topics', () => {
    const event = parser.parse(
      delivery('orders/updated', { admin_graphql_api_id: 'gid://shopify/Order/1' }),
      NOW,
    );

    expect(event?.kind).toBe(ChannelWebhookKind.OrderChanged);
  });

  it.each([
    ['older than the replay window', new Date(NOW - 7 * HOUR_MS).toISOString()],
    ['far in the future', new Date(NOW + HOUR_MS).toISOString()],
    ['not a date', 'yesterday'],
  ])('refuses a delivery triggered %s', (_case, triggeredAt) => {
    const stale = delivery(
      'shop/redact',
      { shop_domain: SHOP },
      {
        'x-shopify-triggered-at': triggeredAt,
      },
    );

    expect(parser.parse(stale, NOW)).toBeNull();
  });

  it('refuses a delivery without its trigger time', () => {
    const { rawBody, headers } = delivery('shop/redact', { shop_domain: SHOP });
    const { 'x-shopify-triggered-at': _omitted, ...withoutTime } = headers;

    expect(parser.parse({ rawBody, headers: withoutTime }, NOW)).toBeNull();
  });

  it('accepts a retry within the window', () => {
    const retry = delivery(
      'shop/redact',
      { shop_domain: SHOP },
      {
        'x-shopify-triggered-at': new Date(NOW - 4 * HOUR_MS).toISOString(),
      },
    );

    expect(parser.parse(retry, NOW)).not.toBeNull();
  });
});
