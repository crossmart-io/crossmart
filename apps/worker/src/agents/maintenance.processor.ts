import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import { AGENT_CLIENT_SWEEP_JOB_NAME, AgentClientSweeper } from '@crossmart/core';

/** Runs scheduled housekeeping from the `maintenance` queue, the lowest-priority one. */
@Processor(QueueName.Maintenance)
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(private readonly agentClients: AgentClientSweeper) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== AGENT_CLIENT_SWEEP_JOB_NAME) {
      this.logger.warn(`Skipped unknown maintenance job ${job.name}`);
      return;
    }
    const deleted = await this.agentClients.sweep();
    if (deleted > 0) this.logger.log(`Deleted ${deleted} unused agent registrations`);
  }
}
