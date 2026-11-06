import { WebhookDeliveryStatus } from '@crossmart/database';
import type { DeliveryAttemptResult } from '../entities/delivery-attempt.js';
import type { DeliveryRef } from '../entities/delivery-ref.js';
import { WebhookDeliveryFailure } from '../enums/webhook-delivery-failure.enum.js';
import { WebhookEventType } from '../enums/webhook-event-type.enum.js';
import type { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import type { WebhookEndpointRepository } from '../repositories/webhook-endpoint.repository.js';
import {
  deliveryToSend,
  storedEvent,
  TEST_DELIVERY_ID,
  TEST_ENDPOINT_ID,
} from '../testing/webhook-fixtures.js';
import { WEBHOOK_MAX_ATTEMPTS } from '../webhooks.constants.js';
import { WebhookDeliveryOutcomes } from './webhook-delivery.outcomes.js';
import type { WebhookEndpointHealth } from './webhook-endpoint.health.js';

const SUCCEEDED: DeliveryAttemptResult = {
  succeeded: true,
  responseStatus: 200,
  durationMs: 30,
  error: null,
};
const FAILED: DeliveryAttemptResult = {
  succeeded: false,
  responseStatus: null,
  durationMs: 30,
  error: WebhookDeliveryFailure.Unreachable,
};

function refAt(attempts: number): DeliveryRef {
  return { deliveryId: TEST_DELIVERY_ID, attempts };
}

function createOutcomes() {
  const recordAttempt = vi.fn<WebhookDeliveryRepository['recordAttempt']>().mockResolvedValue(true);
  const resetFailures = vi.fn<WebhookEndpointRepository['resetFailures']>().mockResolvedValue();
  const recordFailure = vi.fn<WebhookEndpointHealth['recordFailure']>().mockResolvedValue();
  const outcomes = new WebhookDeliveryOutcomes(
    { recordAttempt } as unknown as WebhookDeliveryRepository,
    { resetFailures } as unknown as WebhookEndpointRepository,
    { recordFailure } as unknown as WebhookEndpointHealth,
  );
  const stored = () => recordAttempt.mock.calls[0]?.[1];
  return { outcomes, recordAttempt, resetFailures, recordFailure, stored };
}

describe('WebhookDeliveryOutcomes.record', () => {
  it('settles a successful delivery and clears the endpoint failures', async () => {
    const { outcomes, resetFailures, recordFailure, stored } = createOutcomes();

    await outcomes.record(refAt(0), deliveryToSend(), SUCCEEDED);

    expect(stored()).toMatchObject({
      status: WebhookDeliveryStatus.SUCCEEDED,
      nextAttemptAt: null,
      responseStatus: 200,
      error: null,
    });
    expect(resetFailures).toHaveBeenCalledWith(TEST_ENDPOINT_ID);
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it('schedules a retry after a failure before the last attempt', async () => {
    const { outcomes, resetFailures, recordFailure, stored } = createOutcomes();
    const delivery = deliveryToSend();

    await outcomes.record(refAt(0), delivery, FAILED);

    const record = stored();
    expect(record?.status).toBe(WebhookDeliveryStatus.RETRYING);
    expect(record?.error).toBe(WebhookDeliveryFailure.Unreachable);
    expect(record?.nextAttemptAt?.getTime()).toBeGreaterThan(record?.attemptedAt.getTime() ?? 0);
    expect(recordFailure).toHaveBeenCalledWith(delivery.endpoint);
    expect(resetFailures).not.toHaveBeenCalled();
  });

  it('gives up after the last attempt', async () => {
    const { outcomes, recordFailure, stored } = createOutcomes();

    await outcomes.record(refAt(WEBHOOK_MAX_ATTEMPTS - 1), deliveryToSend(), FAILED);

    expect(stored()).toMatchObject({ status: WebhookDeliveryStatus.FAILED, nextAttemptAt: null });
    expect(recordFailure).toHaveBeenCalledTimes(1);
  });

  it('retries the attempt before the last one', async () => {
    const { outcomes, stored } = createOutcomes();

    await outcomes.record(refAt(WEBHOOK_MAX_ATTEMPTS - 2), deliveryToSend(), FAILED);

    expect(stored()?.status).toBe(WebhookDeliveryStatus.RETRYING);
  });

  it('fails a test event for good after its first attempt', async () => {
    const { outcomes, stored } = createOutcomes();
    const testEvent = storedEvent({ type: WebhookEventType.Test });

    await outcomes.record(refAt(0), deliveryToSend(testEvent), FAILED);

    expect(stored()).toMatchObject({ status: WebhookDeliveryStatus.FAILED, nextAttemptAt: null });
  });

  it('changes nothing else when another attempt was recorded first', async () => {
    const { outcomes, recordAttempt, resetFailures, recordFailure } = createOutcomes();
    recordAttempt.mockResolvedValue(false);

    await outcomes.record(refAt(0), deliveryToSend(), SUCCEEDED);
    await outcomes.record(refAt(0), deliveryToSend(), FAILED);

    expect(resetFailures).not.toHaveBeenCalled();
    expect(recordFailure).not.toHaveBeenCalled();
  });
});
