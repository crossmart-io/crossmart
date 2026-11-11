import { Module } from '@nestjs/common';
import { AgentProposalsStorageModule } from '../agent-proposals/agent-proposals-storage.module.js';
import { GettingStartedRepository } from './repositories/getting-started.repository.js';
import { GettingStartedService } from './services/getting-started.service.js';

/** A new account's next steps, for agents that connect to an empty workspace. */
@Module({
  imports: [AgentProposalsStorageModule],
  providers: [GettingStartedRepository, GettingStartedService],
  exports: [GettingStartedService],
})
export class GettingStartedModule {}
