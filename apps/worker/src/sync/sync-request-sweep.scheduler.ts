import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  SYNC_REQUEST_SWEEP_INTERVAL_MS,
  SYNC_REQUEST_SWEEP_SCHEDULER_ID,
  SyncJobKind,
} from '@crossmart/core';

/**
 * Schedules the sweep of lost sync requests every 15 minutes on the content queue, where the
 * jobs it queues again run; one schedule however many workers.
 */
@Injectable()
export class SyncRequestSweepScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Content) private readonly content: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.content.upsertJobScheduler(
      SYNC_REQUEST_SWEEP_SCHEDULER_ID,
      { every: SYNC_REQUEST_SWEEP_INTERVAL_MS },
      { name: SyncJobKind.SweepSyncRequests, data: {} },
    );
  }
}
