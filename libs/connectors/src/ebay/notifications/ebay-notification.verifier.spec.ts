import { ChannelError } from '../../sdk/errors/channel-error.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import { HttpMethod } from '../../sdk/http/http-method.enum.js';
import { jsonResponse } from '../../sdk/testing/fake-http-transport.js';
import { fixtureResponse, loadFixture } from '../../sdk/testing/fixtures.js';
import { EbayApp } from '../ebay-app.js';
import {
  createEbayTestKit,
  FIXTURES,
  PUBLIC_KEY_URL,
  TEST_CLIENT_ID,
  TEST_CLIENT_SECRET,
  TOKEN_URL,
} from '../ebay.fixtures.js';
import { FakeEbayNotificationSigner } from './fake-ebay-notification-signer.js';

const KEY_ID = '1f2e3d4c-5b6a-4978-8a9b-0c1d2e3f4a5b';
const BODY = loadFixture(FIXTURES, 'account-deletion-notification.json');
const COMPACT_BODY = Buffer.from(JSON.stringify(JSON.parse(BODY)));
const BASIC = `Basic ${Buffer.from(`${TEST_CLIENT_ID}:${TEST_CLIENT_SECRET}`).toString('base64')}`;

interface SdkVector {
  signatureHeader: string;
  publicKeyId: string;
  publicKey: unknown;
  message: unknown;
}

function setup() {
  const kit = createEbayTestKit();
  const signer = new FakeEbayNotificationSigner(KEY_ID);
  const expectKey = (keyId = KEY_ID, response = jsonResponse(signer.publicKeyResponse())) =>
    kit.http.expect(HttpMethod.Get, `${PUBLIC_KEY_URL}${keyId}`, response);
  kit.http.expect(HttpMethod.Post, TOKEN_URL, fixtureResponse(FIXTURES, 'application-token.json'));
  return { ...kit, signer, expectKey };
}

describe('EbayNotificationVerifier', () => {
  it('verifies a body signed with the key eBay publishes for the key id', async () => {
    const { notifications, http, signer, expectKey } = setup();
    expectKey();

    await expect(
      notifications.verify(COMPACT_BODY, signer.signatureHeader(COMPACT_BODY)),
    ).resolves.toBe(true);

    http.assertDone();
    const [tokenRequest, keyRequest] = http.requests;
    expect(tokenRequest.headers?.authorization).toBe(BASIC);
    expect(Object.fromEntries(new URLSearchParams(tokenRequest.body))).toEqual({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope',
    });
    expect(keyRequest.headers?.authorization).toBe('Bearer v^1.1#i^1#fixture_application_token');
  });

  it('rejects a tampered body', async () => {
    const { notifications, signer, expectKey } = setup();
    expectKey();
    const tampered = Buffer.from(COMPACT_BODY.toString().replace('nY4uWx2bQ1e', 'someoneElse'));

    await expect(
      notifications.verify(tampered, signer.signatureHeader(COMPACT_BODY)),
    ).resolves.toBe(false);
  });

  it('rejects a signature made with another key under the same key id', async () => {
    const { notifications, expectKey } = setup();
    expectKey();
    const impostor = new FakeEbayNotificationSigner(KEY_ID);

    await expect(
      notifications.verify(COMPACT_BODY, impostor.signatureHeader(COMPACT_BODY)),
    ).resolves.toBe(false);
  });

  it('rejects a key id eBay does not know, and does not cache it', async () => {
    const { notifications, http, signer, expectKey } = setup();
    const notFound = jsonResponse({ errors: [{ errorId: 195000 }] }, 404);
    expectKey('unknown-kid', notFound);
    expectKey('unknown-kid', notFound);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const header = signer.signatureHeader(COMPACT_BODY, 'unknown-kid');
      await expect(notifications.verify(COMPACT_BODY, header)).resolves.toBe(false);
    }
    http.assertDone();
  });

  it('rejects missing or malformed headers without calling eBay', async () => {
    const { notifications, http } = setup();
    const pathKid = Buffer.from(JSON.stringify({ kid: '../user', signature: 'c2ln' })).toString(
      'base64',
    );

    for (const header of [undefined, '', 'not-base64-json', pathKid]) {
      await expect(notifications.verify(COMPACT_BODY, header)).resolves.toBe(false);
    }
    expect(http.requests).toHaveLength(0);
  });

  it('caches a key for the next notification', async () => {
    const { notifications, http, signer, expectKey } = setup();
    expectKey();

    await notifications.verify(COMPACT_BODY, signer.signatureHeader(COMPACT_BODY));
    await expect(
      notifications.verify(COMPACT_BODY, signer.signatureHeader(COMPACT_BODY)),
    ).resolves.toBe(true);

    expect(http.requests).toHaveLength(2);
  });

  it('refuses keys with an algorithm or digest it does not verify', async () => {
    const { notifications, signer, expectKey } = setup();
    expectKey(KEY_ID, jsonResponse({ ...signer.publicKeyResponse(), algorithm: 'RSA' }));

    await expect(
      notifications.verify(COMPACT_BODY, signer.signatureHeader(COMPACT_BODY)),
    ).resolves.toBe(false);
  });

  it('fails as unavailable when eBay cannot serve the key, so eBay delivers again', async () => {
    const { notifications, signer, expectKey } = setup();
    expectKey(KEY_ID, jsonResponse({ errors: [] }, 500));

    const verifying = notifications.verify(COMPACT_BODY, signer.signatureHeader(COMPACT_BODY));

    await expect(verifying).rejects.toBeInstanceOf(ChannelError);
    await expect(verifying).rejects.toMatchObject({ code: ChannelErrorCode.ChannelUnavailable });
  });

  it('fails as unavailable when eBay is not configured', async () => {
    const { notifications } = createEbayTestKit(new EbayApp(null));
    const signer = new FakeEbayNotificationSigner(KEY_ID);

    await expect(
      notifications.verify(COMPACT_BODY, signer.signatureHeader(COMPACT_BODY)),
    ).rejects.toMatchObject({ code: ChannelErrorCode.ChannelUnavailable });
  });

  it('verifies eBay’s own SDK test vector, as eBay’s SDKs do (re-serialized JSON, SHA-1)', async () => {
    const vector = JSON.parse(loadFixture(FIXTURES, 'sdk-signed-notification.json')) as SdkVector;
    const { notifications, expectKey } = setup();
    expectKey(vector.publicKeyId, jsonResponse(vector.publicKey));
    const prettyPrinted = Buffer.from(JSON.stringify(vector.message, null, 2));

    await expect(notifications.verify(prettyPrinted, vector.signatureHeader)).resolves.toBe(true);
  });
});
