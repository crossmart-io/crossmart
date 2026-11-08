import { AGENT_PROPOSAL_EXPIRY_BATCH_SIZE } from '../agent-proposals.constants.js';
import type { AgentProposalRepository } from '../repositories/agent-proposal.repository.js';
import { AgentProposalExpiryService } from './agent-proposal-expiry.service.js';

describe('AgentProposalExpiryService', () => {
  it('expires in batches until a batch comes back short', async () => {
    const counts = [AGENT_PROPOSAL_EXPIRY_BATCH_SIZE, AGENT_PROPOSAL_EXPIRY_BATCH_SIZE, 3];
    const expireBatch = vi.fn(() => Promise.resolve(counts.shift() ?? 0));
    const service = new AgentProposalExpiryService({
      expireBatch,
    } as unknown as AgentProposalRepository);

    expect(await service.expire(new Date())).toBe(AGENT_PROPOSAL_EXPIRY_BATCH_SIZE * 2 + 3);
    expect(expireBatch).toHaveBeenCalledTimes(3);
  });

  it('does nothing more when nothing is due', async () => {
    const expireBatch = vi.fn(() => Promise.resolve(0));
    const service = new AgentProposalExpiryService({
      expireBatch,
    } as unknown as AgentProposalRepository);

    expect(await service.expire()).toBe(0);
    expect(expireBatch).toHaveBeenCalledTimes(1);
  });
});
