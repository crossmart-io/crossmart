import { Module } from '@nestjs/common';
import { AgentsModule, SandboxModule } from '@crossmart/core';
import { AgentClientSweepScheduler } from './agent-client-sweep.scheduler.js';
import { MaintenanceProcessor } from './maintenance.processor.js';
import { SandboxSweepScheduler } from './sandbox-sweep.scheduler.js';

/** Scheduled housekeeping: unused agent clients, and sandbox account reminders and expiry. */
@Module({
  imports: [AgentsModule, SandboxModule],
  providers: [MaintenanceProcessor, AgentClientSweepScheduler, SandboxSweepScheduler],
})
export class MaintenanceWorkerModule {}
