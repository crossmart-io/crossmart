import { createHmac } from 'node:crypto';
import { ShopifyApp } from './shopify-app.js';
import { ShopifySignatures } from './shopify-signatures.js';

const SECRET = 'test-client-secret';
const signatures = new ShopifySignatures(new ShopifyApp({ clientId: 'id', clientSecret: SECRET }));

/** Shopify's documented example callback, signed with the test secret. */
function signedQuery(query: Record<string, string>): Record<string, string> {
  const message = Object.keys(query)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('&');
  return { ...query, hmac: createHmac('sha256', SECRET).update(message).digest('hex') };
}

const CALLBACK = {
  code: '0907a61c0c8d55e99db179b68161bc00',
  shop: 'demo-store.myshopify.com',
  state: 'signed-state',
  timestamp: '1337178173',
};

describe('ShopifySignatures', () => {
  it('accepts a callback signed with the client secret, in any parameter order', () => {
    const { hmac, ...rest } = signedQuery(CALLBACK);

    expect(signatures.verifyQuery({ hmac, ...rest })).toBe(true);
    expect(signatures.verifyQuery({ ...rest, hmac })).toBe(true);
  });

  it('rejects a tampered, unsigned or foreign-signed callback', () => {
    const signed = signedQuery(CALLBACK);

    expect(signatures.verifyQuery({ ...signed, shop: 'attacker.myshopify.com' })).toBe(false);
    expect(signatures.verifyQuery(CALLBACK)).toBe(false);
    expect(signatures.verifyQuery({ ...signed, hmac: signed.hmac.toUpperCase() })).toBe(false);
    expect(signatures.verifyQuery({ ...signed, hmac: 'short' })).toBe(false);
  });

  it('verifies webhook bodies byte for byte', () => {
    const body = Buffer.from('{"id":1,"domain":"demo-store.myshopify.com"}');
    const signature = createHmac('sha256', SECRET).update(body).digest('base64');

    expect(signatures.verifyBody(body, signature)).toBe(true);
    expect(signatures.verifyBody(Buffer.from(`${body.toString()} `), signature)).toBe(false);
    expect(signatures.verifyBody(body, undefined)).toBe(false);
  });

  it('verifies nothing when no app is configured', () => {
    const unconfigured = new ShopifySignatures(new ShopifyApp(null));

    expect(unconfigured.verifyQuery(signedQuery(CALLBACK))).toBe(false);
    expect(unconfigured.verifyBody(Buffer.from('{}'), 'x')).toBe(false);
  });
});
