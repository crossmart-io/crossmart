import { describe, expect, it } from 'vitest';
import { CrossmartError } from '../errors.js';
import { verifyWebhookSignature } from './verify-webhook-signature.js';
import { WebhookSignatureError, WebhookSignatureFailure } from './webhook-signature-error.js';

const SECRET = 'whsec_test_secret';
const OLD_SECRET = 'whsec_old_secret';
const NOW = new Date('2026-11-06T12:00:00Z');
const TIMESTAMP = Math.floor(NOW.getTime() / 1000);
const PAYLOAD = JSON.stringify({
  id: '0f8b2a52-5d4e-4c3a-9b1e-7c6d5e4f3a2b',
  type: 'order.created',
  createdAt: '2026-11-06T12:00:00.000Z',
  workspaceId: '6a7b8c9d-0e1f-4a2b-8c3d-4e5f6a7b8c9d',
  apiVersion: 'v1',
  data: { orderId: 'ord_1', total: '19.99' },
});

const encoder = new TextEncoder();

async function sign(payload: string, secret = SECRET, timestamp = TIMESTAMP): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  );
}

async function failureOf(promise: Promise<unknown>): Promise<WebhookSignatureError> {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  if (!(error instanceof WebhookSignatureError)) {
    throw new Error('Expected a WebhookSignatureError');
  }
  return error;
}

function verify(header: string | null | undefined, payload: string | Uint8Array = PAYLOAD) {
  return verifyWebhookSignature({ payload, header, secret: SECRET, now: NOW });
}

describe('verifyWebhookSignature', () => {
  it('returns the event when the signature matches', async () => {
    const event = await verify(`t=${TIMESTAMP},v1=${await sign(PAYLOAD)}`);

    expect(event.type).toBe('order.created');
    expect(event.data).toEqual({ orderId: 'ord_1', total: '19.99' });
  });

  it('accepts a Uint8Array payload', async () => {
    const event = await verify(`t=${TIMESTAMP},v1=${await sign(PAYLOAD)}`, encoder.encode(PAYLOAD));

    expect(event.apiVersion).toBe('v1');
  });

  it('accepts either signature during a secret rotation', async () => {
    const newSignature = await sign(PAYLOAD);
    const oldSignature = await sign(PAYLOAD, OLD_SECRET);

    await expect(
      verify(`t=${TIMESTAMP},v1=${oldSignature},v1=${newSignature}`),
    ).resolves.toBeDefined();
    await expect(
      verify(`t=${TIMESTAMP},v1=${newSignature},v1=${oldSignature}`),
    ).resolves.toBeDefined();
  });

  it('ignores unknown schemes and whitespace', async () => {
    const header = `t=${TIMESTAMP}, v0=abc, v1=${await sign(PAYLOAD)}`;

    await expect(verify(header)).resolves.toBeDefined();
  });

  it('rejects a tampered body', async () => {
    const header = `t=${TIMESTAMP},v1=${await sign(PAYLOAD)}`;

    const error = await failureOf(verify(header, PAYLOAD.replace('19.99', '0.01')));

    expect(error).toBeInstanceOf(CrossmartError);
    expect(error.reason).toBe(WebhookSignatureFailure.SignatureMismatch);
  });

  it('rejects a signature made with another secret, without revealing the secret', async () => {
    const error = await failureOf(verify(`t=${TIMESTAMP},v1=${await sign(PAYLOAD, OLD_SECRET)}`));

    expect(error.reason).toBe(WebhookSignatureFailure.SignatureMismatch);
    expect(error.message).not.toContain(SECRET);
  });

  it('rejects a signed timestamp that differs from the header', async () => {
    const error = await failureOf(verify(`t=${TIMESTAMP + 1},v1=${await sign(PAYLOAD)}`));

    expect(error.reason).toBe(WebhookSignatureFailure.SignatureMismatch);
  });

  it.each([
    ['expired', TIMESTAMP - 301],
    ['in the future', TIMESTAMP + 301],
  ])('rejects a timestamp %s beyond the tolerance', async (_label, timestamp) => {
    const header = `t=${timestamp},v1=${await sign(PAYLOAD, SECRET, timestamp)}`;

    const error = await failureOf(verify(header));

    expect(error.reason).toBe(WebhookSignatureFailure.TimestampOutsideTolerance);
  });

  it('accepts a timestamp at the edge of the tolerance', async () => {
    const timestamp = TIMESTAMP - 300;

    await expect(
      verify(`t=${timestamp},v1=${await sign(PAYLOAD, SECRET, timestamp)}`),
    ).resolves.toBeDefined();
  });

  it('honours a custom tolerance', async () => {
    const timestamp = TIMESTAMP - 60;
    const header = `t=${timestamp},v1=${await sign(PAYLOAD, SECRET, timestamp)}`;

    const error = await failureOf(
      verifyWebhookSignature({
        payload: PAYLOAD,
        header,
        secret: SECRET,
        now: NOW,
        toleranceSeconds: 30,
      }),
    );

    expect(error.reason).toBe(WebhookSignatureFailure.TimestampOutsideTolerance);
  });

  it.each([
    [undefined, WebhookSignatureFailure.MissingHeader],
    [null, WebhookSignatureFailure.MissingHeader],
    ['', WebhookSignatureFailure.MissingHeader],
    ['garbage', WebhookSignatureFailure.MalformedHeader],
    ['=abc', WebhookSignatureFailure.MalformedHeader],
    ['v1=abc', WebhookSignatureFailure.MissingTimestamp],
    ['t=12.5,v1=abc', WebhookSignatureFailure.InvalidTimestamp],
    ['t=abc,v1=abc', WebhookSignatureFailure.InvalidTimestamp],
    ['t=-1,v1=abc', WebhookSignatureFailure.InvalidTimestamp],
    [`t=${TIMESTAMP}`, WebhookSignatureFailure.MissingSignature],
    [`t=${TIMESTAMP},v0=abc`, WebhookSignatureFailure.MissingSignature],
    [`t=${TIMESTAMP},v1=not-hex`, WebhookSignatureFailure.SignatureMismatch],
  ])('rejects the header %j', async (header, reason) => {
    const error = await failureOf(verify(header));

    expect(error.reason).toBe(reason);
  });

  it('rejects a signed payload that is not a JSON object', async () => {
    const payload = '[1,2]';

    const error = await failureOf(verify(`t=${TIMESTAMP},v1=${await sign(payload)}`, payload));

    expect(error.reason).toBe(WebhookSignatureFailure.InvalidPayload);
  });
});
