import { Module } from '@nestjs/common';
import { AgentsModule, AskStorageModule, SandboxModule } from '@crossmart/core';
import { AgentClientSweepScheduler } from './agent-client-sweep.scheduler.js';
import { AskRetentionScheduler } from './ask-retention.scheduler.js';
import { MaintenanceProcessor } from './maintenance.processor.js';
import { SandboxSweepScheduler } from './sandbox-sweep.scheduler.js';

/**
 * Scheduled housekeeping: unused agent clients, sandbox account reminders and expiry, and the
 * retention of Ask Crossmart's conversations.
 */
@Module({
  imports: [AgentsModule, AskStorageModule, SandboxModule],
  providers: [
    MaintenanceProcessor,
    AgentClientSweepScheduler,
    AskRetentionScheduler,
    SandboxSweepScheduler,
  ],
})
export class MaintenanceWorkerModule {}
