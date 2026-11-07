import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  SANDBOX_SWEEP_INTERVAL_MS,
  SANDBOX_SWEEP_JOB_NAME,
  SANDBOX_SWEEP_SCHEDULER_ID,
} from '@crossmart/core';

/** Schedules the sandbox account sweep hourly; one schedule however many workers. */
@Injectable()
export class SandboxSweepScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Maintenance) private readonly maintenance: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.maintenance.upsertJobScheduler(
      SANDBOX_SWEEP_SCHEDULER_ID,
      { every: SANDBOX_SWEEP_INTERVAL_MS },
      { name: SANDBOX_SWEEP_JOB_NAME, data: {} },
    );
  }
}
