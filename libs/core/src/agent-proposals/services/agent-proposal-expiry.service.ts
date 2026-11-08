import { Injectable } from '@nestjs/common';
import {
  AGENT_PROPOSAL_EXPIRY_BATCH_SIZE,
  AGENT_PROPOSAL_EXPIRY_MAX_BATCHES,
} from '../agent-proposals.constants.js';
import { AgentProposalRepository } from '../repositories/agent-proposal.repository.js';

/**
 * Marks proposals nobody decided within `AGENT_PROPOSAL_TTL_DAYS` as expired (ADR 0028), in
 * batches; reads already treat them as expired, so this only makes it stick. Running it twice
 * changes nothing more.
 */
@Injectable()
export class AgentProposalExpiryService {
  constructor(private readonly proposals: AgentProposalRepository) {}

  /** Returns how many proposals expired. */
  async expire(now = new Date()): Promise<number> {
    let expired = 0;
    for (let batch = 0; batch < AGENT_PROPOSAL_EXPIRY_MAX_BATCHES; batch += 1) {
      const count = await this.proposals.expireBatch(now, AGENT_PROPOSAL_EXPIRY_BATCH_SIZE);
      expired += count;
      if (count < AGENT_PROPOSAL_EXPIRY_BATCH_SIZE) break;
    }
    return expired;
  }
}
