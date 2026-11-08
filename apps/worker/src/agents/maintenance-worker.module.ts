import { Module } from '@nestjs/common';
import {
  AgentsModule,
  AgentWorkerStorageModule,
  AskStorageModule,
  SandboxModule,
} from '@crossmart/core';
import { AgentClientSweepScheduler } from './agent-client-sweep.scheduler.js';
import { AgentWorkerRetentionScheduler } from './agent-worker-retention.scheduler.js';
import { AskRetentionScheduler } from './ask-retention.scheduler.js';
import { MaintenanceProcessor } from './maintenance.processor.js';
import { SandboxSweepScheduler } from './sandbox-sweep.scheduler.js';

/**
 * Scheduled housekeeping: unused agent clients, sandbox account reminders and expiry, and the
 * retention of Ask Crossmart's and Agent Worker's conversations.
 */
@Module({
  imports: [AgentsModule, AgentWorkerStorageModule, AskStorageModule, SandboxModule],
  providers: [
    MaintenanceProcessor,
    AgentClientSweepScheduler,
    AskRetentionScheduler,
    AgentWorkerRetentionScheduler,
    SandboxSweepScheduler,
  ],
})
export class MaintenanceWorkerModule {}
