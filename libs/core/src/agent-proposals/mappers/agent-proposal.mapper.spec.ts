import { AgentProposalStatus } from '../enums/agent-proposal-status.enum.js';
import { proposalRecord } from '../testing/agent-proposal.fixtures.js';
import { effectiveStatus, toProposalView } from './agent-proposal.mapper.js';

describe('agent proposal mapper', () => {
  it('reads a pending proposal past its expiry as expired', () => {
    const now = new Date();
    const lapsed = proposalRecord({ expiresAt: new Date(now.getTime() - 1) });
    expect(effectiveStatus(lapsed, now)).toBe(AgentProposalStatus.Expired);
    expect(effectiveStatus(proposalRecord(), now)).toBe(AgentProposalStatus.Pending);
  });

  it('keeps known risks and a well-formed preview only', () => {
    const record = proposalRecord({
      risks: ['price_change', 'from_the_future'],
      preview: { unexpected: true },
    });
    const view = toProposalView(record, (): string => 'Change a title', new Date());
    expect(view.risks).toEqual(['price_change']);
    expect(view.preview).toBeNull();
    expect(view.toolTitle).toBe('Change a title');
  });
});
