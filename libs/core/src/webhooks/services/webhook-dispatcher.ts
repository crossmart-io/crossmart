import { Injectable } from '@nestjs/common';
import { WebhookJobQueue } from '../queue/webhook-job.queue.js';
import { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import {
  WEBHOOK_DELIVERY_LEASE_MS,
  WEBHOOK_DISPATCH_BATCH_SIZE,
  WEBHOOK_DISPATCH_MAX_BATCHES,
} from '../webhooks.constants.js';

/**
 * Moves due deliveries from the outbox to the queue: claims them in batches under a lease and
 * queues one job each. Any number of workers can dispatch at once; a delivery is claimed once.
 */
@Injectable()
export class WebhookDispatcher {
  constructor(
    private readonly deliveries: WebhookDeliveryRepository,
    private readonly queue: WebhookJobQueue,
  ) {}

  /** Returns how many deliveries were queued. */
  async dispatch(): Promise<number> {
    let queued = 0;
    for (let batch = 0; batch < WEBHOOK_DISPATCH_MAX_BATCHES; batch += 1) {
      const now = new Date();
      const leaseUntil = new Date(now.getTime() + WEBHOOK_DELIVERY_LEASE_MS);
      const claimed = await this.deliveries.claimDue(now, leaseUntil, WEBHOOK_DISPATCH_BATCH_SIZE);
      await this.queue.deliverAll(claimed);
      queued += claimed.length;
      if (claimed.length < WEBHOOK_DISPATCH_BATCH_SIZE) break;
    }
    return queued;
  }
}
