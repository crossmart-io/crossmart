import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  AGENT_CLIENT_SWEEP_INTERVAL_MS,
  AGENT_CLIENT_SWEEP_JOB_NAME,
  AGENT_CLIENT_SWEEP_SCHEDULER_ID,
} from '@crossmart/core';

/** Schedules the unused agent registration sweep hourly; one schedule however many workers. */
@Injectable()
export class AgentClientSweepScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Maintenance) private readonly maintenance: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.maintenance.upsertJobScheduler(
      AGENT_CLIENT_SWEEP_SCHEDULER_ID,
      { every: AGENT_CLIENT_SWEEP_INTERVAL_MS },
      { name: AGENT_CLIENT_SWEEP_JOB_NAME, data: {} },
    );
  }
}
