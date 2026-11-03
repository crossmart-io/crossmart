import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  IMPORT_SWEEP_INTERVAL_MS,
  IMPORT_SWEEP_JOB_NAME,
  IMPORT_SWEEP_SCHEDULER_ID,
} from '@crossmart/core';

/** Schedules the stalled-import sweep every 10 minutes; one schedule however many workers. */
@Injectable()
export class StalledImportScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Import) private readonly imports: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.imports.upsertJobScheduler(
      IMPORT_SWEEP_SCHEDULER_ID,
      { every: IMPORT_SWEEP_INTERVAL_MS },
      { name: IMPORT_SWEEP_JOB_NAME, data: {} },
    );
  }
}
