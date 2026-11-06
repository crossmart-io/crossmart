import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  WEBHOOK_DISPATCH_INTERVAL_MS,
  WEBHOOK_DISPATCH_SCHEDULER_ID,
  WEBHOOK_RETENTION_INTERVAL_MS,
  WEBHOOK_RETENTION_SCHEDULER_ID,
  WebhookJobName,
} from '@crossmart/core';

/**
 * Schedules the webhook dispatch every few seconds and the retention clean-up daily; one
 * schedule each however many workers run.
 */
@Injectable()
export class WebhookSchedulers implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Webhooks) private readonly webhooks: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.webhooks.upsertJobScheduler(
      WEBHOOK_DISPATCH_SCHEDULER_ID,
      { every: WEBHOOK_DISPATCH_INTERVAL_MS },
      { name: WebhookJobName.Dispatch, data: {} },
    );
    await this.webhooks.upsertJobScheduler(
      WEBHOOK_RETENTION_SCHEDULER_ID,
      { every: WEBHOOK_RETENTION_INTERVAL_MS },
      { name: WebhookJobName.CleanUp, data: {} },
    );
  }
}
