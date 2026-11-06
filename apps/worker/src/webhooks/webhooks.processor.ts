import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  type DeliveryRef,
  WebhookDeliveryRunner,
  WebhookDispatcher,
  WebhookJobName,
  WebhookRetentionService,
} from '@crossmart/core';
import { WEBHOOK_WORKER_CONCURRENCY } from './webhooks-worker.constants.js';

export type WebhookQueueJob = Job<DeliveryRef | Record<string, never>, void, string>;

function isDelivery(job: WebhookQueueJob): job is Job<DeliveryRef, void, string> {
  return job.name === WebhookJobName.Deliver;
}

/**
 * Runs the `webhooks` queue: dispatching due deliveries, sending one delivery, and the daily
 * clean-up. Failures of a delivery are stored on it, never thrown, so BullMQ never retries.
 */
@Processor(QueueName.Webhooks, { concurrency: WEBHOOK_WORKER_CONCURRENCY })
export class WebhooksProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhooksProcessor.name);

  constructor(
    private readonly dispatcher: WebhookDispatcher,
    private readonly runner: WebhookDeliveryRunner,
    private readonly retention: WebhookRetentionService,
  ) {
    super();
  }

  async process(job: WebhookQueueJob): Promise<void> {
    if (isDelivery(job)) {
      await this.runner.deliver(job.data);
      return;
    }
    if (job.name === WebhookJobName.Dispatch) {
      await this.dispatcher.dispatch();
      return;
    }
    if (job.name === WebhookJobName.CleanUp) {
      const deleted = await this.retention.purge();
      if (deleted > 0) this.logger.log(`Deleted ${deleted} webhook events past retention`);
      return;
    }
    this.logger.warn(`Skipped unknown webhook job ${job.name}`);
  }
}
