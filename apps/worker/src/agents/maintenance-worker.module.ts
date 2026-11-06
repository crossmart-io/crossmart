import { Module } from '@nestjs/common';
import { AgentsModule } from '@crossmart/core';
import { AgentClientSweepScheduler } from './agent-client-sweep.scheduler.js';
import { MaintenanceProcessor } from './maintenance.processor.js';

/** Scheduled housekeeping, such as deleting unused agent clients. */
@Module({
  imports: [AgentsModule],
  providers: [MaintenanceProcessor, AgentClientSweepScheduler],
})
export class MaintenanceWorkerModule {}
