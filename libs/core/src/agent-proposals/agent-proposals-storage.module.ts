import { Module } from '@nestjs/common';
import { AgentProposalRepository } from './repositories/agent-proposal.repository.js';
import { AgentProposalExpiryService } from './services/agent-proposal-expiry.service.js';
import { AgentProposalTokenService } from './services/agent-proposal-token.service.js';

/**
 * Where outside agents' proposals are stored, their expiry, and the credential that applies an
 * approved one (ADR 0028). Apart from `AgentProposalsModule` so the worker can expire them and
 * the API's authentication can verify the credential without the rest.
 */
@Module({
  providers: [AgentProposalRepository, AgentProposalExpiryService, AgentProposalTokenService],
  exports: [AgentProposalRepository, AgentProposalExpiryService, AgentProposalTokenService],
})
export class AgentProposalsStorageModule {}
