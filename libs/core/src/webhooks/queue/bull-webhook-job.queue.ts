import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import type { DeliveryRef } from '../entities/delivery-ref.js';
import { WebhookJobName } from '../enums/webhook-job-name.enum.js';
import {
  WEBHOOK_DISPATCH_DEDUPLICATION_ID,
  WEBHOOK_JOB_KEY_SEPARATOR,
  WEBHOOK_JOBS_KEPT_COMPLETED,
  WEBHOOK_JOBS_KEPT_FAILED,
} from '../webhooks.constants.js';
import { WebhookJobQueue } from './webhook-job.queue.js';

const JOB_RETENTION = {
  removeOnComplete: WEBHOOK_JOBS_KEPT_COMPLETED,
  removeOnFail: WEBHOOK_JOBS_KEPT_FAILED,
};

/**
 * Queues webhook jobs on the `webhooks` queue. Retries are not BullMQ's: each attempt's outcome
 * and the next attempt's time are stored on the delivery, where the merchant sees them.
 */
@Injectable()
export class BullWebhookJobQueue extends WebhookJobQueue {
  constructor(@InjectQueue(QueueName.Webhooks) private readonly queue: Queue) {
    super();
  }

  async deliverAll(refs: readonly DeliveryRef[]): Promise<void> {
    if (refs.length === 0) return;
    await this.queue.addBulk(
      refs.map((ref) => ({
        name: WebhookJobName.Deliver,
        data: ref,
        opts: {
          // A delivery claimed again before its job ran is queued once per attempt.
          deduplication: {
            id: [ref.deliveryId, ref.attempts].join(WEBHOOK_JOB_KEY_SEPARATOR),
          },
          ...JOB_RETENTION,
        },
      })),
    );
  }

  async dispatchSoon(): Promise<void> {
    await this.queue.add(
      WebhookJobName.Dispatch,
      {},
      { deduplication: { id: WEBHOOK_DISPATCH_DEDUPLICATION_ID }, ...JOB_RETENTION },
    );
  }
}
