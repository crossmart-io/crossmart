import type { DeliveryRef } from '../entities/delivery-ref.js';
import type { WebhookJobQueue } from '../queue/webhook-job.queue.js';
import type { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import {
  WEBHOOK_DELIVERY_LEASE_MS,
  WEBHOOK_DISPATCH_BATCH_SIZE,
  WEBHOOK_DISPATCH_MAX_BATCHES,
} from '../webhooks.constants.js';
import { WebhookDispatcher } from './webhook-dispatcher.js';

function refs(count: number, offset = 0): DeliveryRef[] {
  return Array.from({ length: count }, (_, index) => ({
    deliveryId: `delivery-${offset + index}`,
    attempts: 0,
  }));
}

function createDispatcher(batchSizes: number[]) {
  const claimDue = vi.fn<WebhookDeliveryRepository['claimDue']>();
  for (const [index, size] of batchSizes.entries()) {
    claimDue.mockResolvedValueOnce(refs(size, index * WEBHOOK_DISPATCH_BATCH_SIZE));
  }
  claimDue.mockResolvedValue(refs(WEBHOOK_DISPATCH_BATCH_SIZE));
  const deliverAll = vi.fn<WebhookJobQueue['deliverAll']>().mockResolvedValue();
  const dispatcher = new WebhookDispatcher(
    { claimDue } as unknown as WebhookDeliveryRepository,
    { deliverAll } as unknown as WebhookJobQueue,
  );
  return { dispatcher, claimDue, deliverAll };
}

describe('WebhookDispatcher.dispatch', () => {
  it('claims full batches under a lease and stops after a short one', async () => {
    const { dispatcher, claimDue, deliverAll } = createDispatcher([WEBHOOK_DISPATCH_BATCH_SIZE, 3]);

    const queued = await dispatcher.dispatch();

    expect(queued).toBe(WEBHOOK_DISPATCH_BATCH_SIZE + 3);
    expect(claimDue).toHaveBeenCalledTimes(2);
    const [now, leaseUntil, limit] = claimDue.mock.calls[0] ?? [];
    expect(limit).toBe(WEBHOOK_DISPATCH_BATCH_SIZE);
    expect((leaseUntil?.getTime() ?? 0) - (now?.getTime() ?? 0)).toBe(WEBHOOK_DELIVERY_LEASE_MS);
    expect(deliverAll.mock.calls.map(([batch]) => batch.length)).toEqual([
      WEBHOOK_DISPATCH_BATCH_SIZE,
      3,
    ]);
  });

  it('returns zero after one claim when nothing is due', async () => {
    const { dispatcher, claimDue } = createDispatcher([0]);

    expect(await dispatcher.dispatch()).toBe(0);
    expect(claimDue).toHaveBeenCalledTimes(1);
  });

  it('never claims more than the maximum number of batches in one run', async () => {
    const { dispatcher, claimDue, deliverAll } = createDispatcher([]);

    const queued = await dispatcher.dispatch();

    expect(claimDue).toHaveBeenCalledTimes(WEBHOOK_DISPATCH_MAX_BATCHES);
    expect(deliverAll).toHaveBeenCalledTimes(WEBHOOK_DISPATCH_MAX_BATCHES);
    expect(queued).toBe(WEBHOOK_DISPATCH_MAX_BATCHES * WEBHOOK_DISPATCH_BATCH_SIZE);
  });
});
