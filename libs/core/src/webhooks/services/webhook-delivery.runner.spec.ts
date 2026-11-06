import { createHmac } from 'node:crypto';
import type { DeliveryAttemptResult, WebhookRequest } from '../entities/delivery-attempt.js';
import type { DeliveryRef } from '../entities/delivery-ref.js';
import type { WebhookEnvelope } from '../entities/webhook-envelope.js';
import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';
import type { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import {
  deliveryToSend,
  TEST_DELIVERY_ID,
  TEST_ENDPOINT_ID,
  TEST_ENDPOINT_URL,
  TEST_EVENT_ID,
  TEST_WORKSPACE_ID,
} from '../testing/webhook-fixtures.js';
import { WebhookHeader } from '../webhooks.constants.js';
import type { WebhookDeliveryOutcomes } from './webhook-delivery.outcomes.js';
import { WebhookDeliveryRunner } from './webhook-delivery.runner.js';
import type { WebhookSecretVault } from './webhook-secret.vault.js';
import type { WebhookSender } from './webhook-sender.js';

const REF: DeliveryRef = { deliveryId: TEST_DELIVERY_ID, attempts: 2 };
const SECRET = 'whsec_runner-secret';
const SENT: DeliveryAttemptResult = {
  succeeded: true,
  responseStatus: 200,
  durationMs: 12,
  error: null,
};

function createRunner() {
  const delivery = deliveryToSend();
  const startAttempt = vi
    .fn<WebhookDeliveryRepository['startAttempt']>()
    .mockResolvedValue(delivery);
  const signingSecrets = vi.fn<WebhookSecretVault['signingSecrets']>().mockResolvedValue([SECRET]);
  const send = vi.fn<WebhookSender['send']>().mockResolvedValue(SENT);
  const record = vi.fn<WebhookDeliveryOutcomes['record']>().mockResolvedValue();
  const runner = new WebhookDeliveryRunner(
    { startAttempt } as unknown as WebhookDeliveryRepository,
    { signingSecrets } as unknown as WebhookSecretVault,
    { send } as unknown as WebhookSender,
    { record } as unknown as WebhookDeliveryOutcomes,
  );
  return { runner, delivery, startAttempt, signingSecrets, send, record };
}

/** Whether the header carries a valid v1 signature of the body with the secret. */
function signatureMatches(header: string, body: string, secret: string): boolean {
  const pairs = new Map(header.split(',').map((pair) => pair.split('=') as [string, string]));
  const expected = createHmac('sha256', secret)
    .update(`${pairs.get('t')}.${body}`)
    .digest('hex');
  return pairs.get('v1') === expected;
}

describe('WebhookDeliveryRunner.deliver', () => {
  it('does nothing when the delivery was settled or tried meanwhile', async () => {
    const { runner, startAttempt, send, record } = createRunner();
    startAttempt.mockResolvedValue(null);

    await runner.deliver(REF);

    expect(send).not.toHaveBeenCalled();
    expect(record).not.toHaveBeenCalled();
  });

  it('sends the event signed with the endpoint secret and records the result', async () => {
    const { runner, delivery, signingSecrets, send, record } = createRunner();

    await runner.deliver(REF);

    expect(signingSecrets.mock.calls[0]?.[0]).toEqual({
      workspaceId: TEST_WORKSPACE_ID,
      endpointId: TEST_ENDPOINT_ID,
    });
    const request = send.mock.calls[0]?.[0] as WebhookRequest;
    expect(request.url).toBe(TEST_ENDPOINT_URL);
    expect((JSON.parse(request.body) as WebhookEnvelope).id).toBe(TEST_EVENT_ID);
    expect(request.headers[WebhookHeader.EventId]).toBe(TEST_EVENT_ID);
    expect(request.headers[WebhookHeader.EventType]).toBe(delivery.event.type);
    expect(request.headers[WebhookHeader.DeliveryId]).toBe(TEST_DELIVERY_ID);
    const signature = request.headers[WebhookHeader.Signature] ?? '';
    expect(signatureMatches(signature, request.body, SECRET)).toBe(true);
    expect(signatureMatches(signature, request.body, 'whsec_other')).toBe(false);
    expect(record).toHaveBeenCalledWith(REF, delivery, SENT);
  });

  it('records a failure without sending when the secret cannot be opened', async () => {
    const { runner, delivery, signingSecrets, send, record } = createRunner();
    signingSecrets.mockRejectedValue(new Error('bad key'));

    await runner.deliver(REF);

    expect(send).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(REF, delivery, {
      succeeded: false,
      responseStatus: null,
      durationMs: 0,
      error: WebhookDeliveryFailure.SecretUnavailable,
    });
  });
});
