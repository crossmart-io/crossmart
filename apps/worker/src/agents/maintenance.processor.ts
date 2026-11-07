import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  AGENT_CLIENT_SWEEP_JOB_NAME,
  AGENT_WORKER_RETENTION_JOB_NAME,
  AgentClientSweeper,
  AgentWorkerRetentionService,
  ASK_RETENTION_JOB_NAME,
  AskRetentionService,
  SANDBOX_SWEEP_JOB_NAME,
  SandboxSweeper,
} from '@crossmart/core';

/** Runs scheduled housekeeping from the `maintenance` queue, the lowest-priority one. */
@Processor(QueueName.Maintenance)
export class MaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(MaintenanceProcessor.name);

  constructor(
    private readonly agentClients: AgentClientSweeper,
    private readonly sandboxes: SandboxSweeper,
    private readonly askRetention: AskRetentionService,
    private readonly agentWorkerRetention: AgentWorkerRetentionService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case AGENT_CLIENT_SWEEP_JOB_NAME:
        return this.sweepAgentClients();
      case SANDBOX_SWEEP_JOB_NAME:
        return this.sweepSandboxes();
      case ASK_RETENTION_JOB_NAME:
        return this.purgeAskConversations();
      case AGENT_WORKER_RETENTION_JOB_NAME:
        return this.purgeAgentWorkerConversations();
      default:
        this.logger.warn(`Skipped unknown maintenance job ${job.name}`);
    }
  }

  private async sweepAgentClients(): Promise<void> {
    const { neverUsed, stale } = await this.agentClients.sweep();
    if (neverUsed + stale > 0) {
      this.logger.log(
        `Deleted ${neverUsed} never-used agent registrations and ${stale} unused agent clients`,
      );
    }
  }

  private async sweepSandboxes(): Promise<void> {
    const { reminded, deleted } = await this.sandboxes.sweep();
    if (reminded + deleted > 0) {
      this.logger.log(
        `Reminded ${reminded} sandbox accounts to be claimed and deleted ${deleted} expired ones`,
      );
    }
  }

  private async purgeAskConversations(): Promise<void> {
    const deleted = await this.askRetention.purge();
    if (deleted > 0) {
      this.logger.log(`Deleted ${deleted} Ask Crossmart conversations past their retention`);
    }
  }

  private async purgeAgentWorkerConversations(): Promise<void> {
    const deleted = await this.agentWorkerRetention.purge();
    if (deleted > 0) {
      this.logger.log(`Deleted ${deleted} Agent Worker conversations past their retention`);
    }
  }
}
