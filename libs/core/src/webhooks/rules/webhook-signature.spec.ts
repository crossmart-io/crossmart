import { createHmac } from 'node:crypto';
import { signWebhookPayload, toUnixSeconds, webhookSignatureHeader } from './webhook-signature.js';

const SECRET = 'whsec_test-secret';
const OLD_SECRET = 'whsec_old-secret';
const BODY = '{"id":"evt","type":"order.created"}';
const TIMESTAMP = 1_800_000_000;

function expected(secret: string): string {
  return createHmac('sha256', secret).update(`${TIMESTAMP}.${BODY}`).digest('hex');
}

describe('webhook signatures', () => {
  it('signs the timestamp and the body with HMAC-SHA256 in hex', () => {
    expect(signWebhookPayload(SECRET, TIMESTAMP, BODY)).toBe(expected(SECRET));
  });

  it('puts the timestamp first, then one v1 per secret', () => {
    expect(webhookSignatureHeader([SECRET, OLD_SECRET], TIMESTAMP, BODY)).toBe(
      `t=${TIMESTAMP},v1=${expected(SECRET)},v1=${expected(OLD_SECRET)}`,
    );
  });

  it('changes when the body changes', () => {
    expect(signWebhookPayload(SECRET, TIMESTAMP, `${BODY} `)).not.toBe(expected(SECRET));
  });

  it('counts whole seconds', () => {
    expect(toUnixSeconds(new Date(1_800_000_000_999))).toBe(TIMESTAMP);
  });
});
