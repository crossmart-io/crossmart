import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  AGENT_WORKER_RETENTION_INTERVAL_MS,
  AGENT_WORKER_RETENTION_JOB_NAME,
  AGENT_WORKER_RETENTION_SCHEDULER_ID,
} from '@crossmart/core';

/** Schedules the purge of old Agent Worker conversations daily; one schedule however many workers. */
@Injectable()
export class AgentWorkerRetentionScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Maintenance) private readonly maintenance: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.maintenance.upsertJobScheduler(
      AGENT_WORKER_RETENTION_SCHEDULER_ID,
      { every: AGENT_WORKER_RETENTION_INTERVAL_MS },
      { name: AGENT_WORKER_RETENTION_JOB_NAME, data: {} },
    );
  }
}
