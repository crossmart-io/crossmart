import { Module } from '@nestjs/common';
import { AgentProposalsModule, AgentProposalsStorageModule } from '@crossmart/core';
import { LoopbackModule } from '../common/loopback/loopback.module.js';
import { AgentProposalsController } from './controllers/agent-proposals.controller.js';
import { LoopbackProposalExecutor } from './services/loopback-proposal.executor.js';
import { ProposerContext } from './services/proposer-context.js';

/**
 * Outside agents' proposals (ADR 0028); an approved one is applied by calling this API over the
 * loopback interface as its agent. The guard that turns agents' direct writes away is global
 * (`AuthModule`).
 */
@Module({
  imports: [
    AgentProposalsModule.register({
      executor: LoopbackProposalExecutor,
      imports: [LoopbackModule],
    }),
    AgentProposalsStorageModule,
    LoopbackModule,
  ],
  controllers: [AgentProposalsController],
  providers: [ProposerContext],
})
export class AgentProposalsApiModule {}
