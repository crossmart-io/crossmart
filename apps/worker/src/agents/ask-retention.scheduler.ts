import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  ASK_RETENTION_INTERVAL_MS,
  ASK_RETENTION_JOB_NAME,
  ASK_RETENTION_SCHEDULER_ID,
} from '@crossmart/core';

/** Schedules the purge of old Ask Crossmart conversations daily; one schedule however many workers. */
@Injectable()
export class AskRetentionScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Maintenance) private readonly maintenance: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.maintenance.upsertJobScheduler(
      ASK_RETENTION_SCHEDULER_ID,
      { every: ASK_RETENTION_INTERVAL_MS },
      { name: ASK_RETENTION_JOB_NAME, data: {} },
    );
  }
}
