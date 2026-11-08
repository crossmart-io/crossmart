import { toProposalView } from '../../agent-proposals/mappers/agent-proposal.mapper.js';
import { AgentProposalStatus } from '../../agent-proposals/enums/agent-proposal-status.enum.js';
import { proposalRecord } from '../../agent-proposals/testing/agent-proposal.fixtures.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { agentProposalEvents } from './agent-proposal-events.js';

const title = (name: string): string => name;

function eventsOf(overrides: Parameters<typeof proposalRecord>[0]) {
  return agentProposalEvents(toProposalView(proposalRecord(overrides), title, new Date()));
}

describe('agentProposalEvents', () => {
  it('shows a waiting proposal as received, by the agent for its person', () => {
    const [received, ...rest] = eventsOf({});
    expect(rest).toEqual([]);
    expect(received).toMatchObject({
      type: WorkspaceEventType.AgentProposalReceived,
      actor: { agentName: 'Claude', name: 'Dana' },
      refs: { proposalId: expect.any(String) },
    });
    expect(received?.summary).toMatch(/^Claude proposed: /);
  });

  it('adds the decision by the person who made it', () => {
    const decidedAt = new Date();
    const events = eventsOf({
      status: AgentProposalStatus.Applied,
      decidedAt,
      decidedBy: { name: 'Lee' },
    });
    expect(events.map((event) => event.type)).toEqual([
      WorkspaceEventType.AgentProposalReceived,
      WorkspaceEventType.AgentProposalApproved,
    ]);
    expect(events[1]?.actor.name).toBe('Lee');
  });

  it('adds a failure once an approved change was refused', () => {
    const at = new Date();
    const events = eventsOf({
      status: AgentProposalStatus.Failed,
      decidedAt: at,
      finishedAt: at,
      result: 'Crossmart refused (403)',
    });
    expect(events.at(-1)).toMatchObject({
      type: WorkspaceEventType.AgentProposalFailed,
      detail: 'Crossmart refused (403)',
    });
  });

  it('shows a lapsed proposal as expired at its expiry', () => {
    const expiresAt = new Date(Date.now() - 1_000);
    const events = eventsOf({ expiresAt });
    expect(events[1]).toMatchObject({
      type: WorkspaceEventType.AgentProposalExpired,
      occurredAt: expiresAt,
    });
  });
});
