import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  AGENT_PROPOSAL_EXPIRY_INTERVAL_MS,
  AGENT_PROPOSAL_EXPIRY_JOB_NAME,
  AGENT_PROPOSAL_EXPIRY_SCHEDULER_ID,
} from '@crossmart/core';

/** Expires outside agents' proposals nobody decided, hourly; one schedule however many workers. */
@Injectable()
export class AgentProposalExpiryScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Maintenance) private readonly maintenance: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.maintenance.upsertJobScheduler(
      AGENT_PROPOSAL_EXPIRY_SCHEDULER_ID,
      { every: AGENT_PROPOSAL_EXPIRY_INTERVAL_MS },
      { name: AGENT_PROPOSAL_EXPIRY_JOB_NAME, data: {} },
    );
  }
}
