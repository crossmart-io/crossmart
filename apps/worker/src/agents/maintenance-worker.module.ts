import { Module } from '@nestjs/common';
import {
  AgentProposalsStorageModule,
  AgentsModule,
  AgentWorkerStorageModule,
  AskStorageModule,
  SandboxModule,
} from '@crossmart/core';
import { AgentClientSweepScheduler } from './agent-client-sweep.scheduler.js';
import { AgentProposalExpiryScheduler } from './agent-proposal-expiry.scheduler.js';
import { AgentWorkerRetentionScheduler } from './agent-worker-retention.scheduler.js';
import { AskRetentionScheduler } from './ask-retention.scheduler.js';
import { ConversationRetention } from './conversation-retention.js';
import { MaintenanceProcessor } from './maintenance.processor.js';
import { SandboxSweepScheduler } from './sandbox-sweep.scheduler.js';

/**
 * Scheduled housekeeping: unused agent clients, sandbox account reminders and expiry, and the
 * retention of Ask Crossmart's and Agent Worker's conversations, and the expiry of outside
 * agents' proposals.
 */
@Module({
  imports: [
    AgentsModule,
    AgentWorkerStorageModule,
    AgentProposalsStorageModule,
    AskStorageModule,
    SandboxModule,
  ],
  providers: [
    MaintenanceProcessor,
    ConversationRetention,
    AgentClientSweepScheduler,
    AskRetentionScheduler,
    AgentWorkerRetentionScheduler,
    AgentProposalExpiryScheduler,
    SandboxSweepScheduler,
  ],
})
export class MaintenanceWorkerModule {}
