import { ActivityActorType } from '@crossmart/database';
import type { AgentProposalView } from '../../agent-proposals/entities/agent-proposal-views.js';
import { AgentProposalStatus } from '../../agent-proposals/enums/agent-proposal-status.enum.js';
import type { WorkspaceEventActor } from '../entities/workspace-event.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { eventId, type WorkspaceEventDraft } from './workspace-event-kinds.js';

export const AGENT_PROPOSAL_EVENT_PREFIX = 'proposal';

/** The steps of one proposal, each its own event. */
enum ProposalStep {
  Received = 'received',
  Decided = 'decided',
  Failed = 'failed',
}

/** How each step reads; the proposal's own summary follows. */
export const AGENT_PROPOSAL_EVENT_COPY = {
  received: (agent: string, summary: string) => `${agent} proposed: ${summary}`,
  approved: (agent: string, summary: string) => `Approved ${agent}'s proposal: ${summary}`,
  rejected: (agent: string, summary: string) => `Rejected ${agent}'s proposal: ${summary}`,
  expired: (agent: string, summary: string) => `${agent}'s proposal expired: ${summary}`,
  failed: (agent: string, summary: string) => `${agent}'s approved change failed: ${summary}`,
} as const;

/** Statuses a proposal reaches once someone approved it. */
const APPROVED_STATUSES: readonly AgentProposalStatus[] = [
  AgentProposalStatus.Applying,
  AgentProposalStatus.Applied,
  AgentProposalStatus.Failed,
];

const SYSTEM_ACTOR: WorkspaceEventActor = {
  type: ActivityActorType.SYSTEM,
  name: null,
  agentName: null,
  approvedByName: null,
};

function agentActor(view: AgentProposalView): WorkspaceEventActor {
  const type = ActivityActorType.AGENT;
  return { type, name: view.onBehalfOfName, agentName: view.agentName, approvedByName: null };
}

function personActor(view: AgentProposalView): WorkspaceEventActor {
  const type = ActivityActorType.USER;
  return { type, name: view.decidedByName, agentName: null, approvedByName: null };
}

type StepEvent = Pick<WorkspaceEventDraft, 'type' | 'summary' | 'detail' | 'actor'>;

function draft(
  view: AgentProposalView,
  step: ProposalStep,
  at: Date,
  event: StepEvent,
): WorkspaceEventDraft {
  return {
    id: eventId(AGENT_PROPOSAL_EVENT_PREFIX, view.id, step),
    refs: {
      connectionId: view.targets.connectionIds[0] ?? null,
      productId: view.targets.productIds[0] ?? null,
      proposalId: view.id,
    },
    itemCount: null,
    occurredAt: at,
    ...event,
  };
}

function decidedStep(view: AgentProposalView): StepEvent | null {
  const { agentName, summary } = view;
  if (APPROVED_STATUSES.includes(view.status)) {
    const text = AGENT_PROPOSAL_EVENT_COPY.approved(agentName, summary);
    const type = WorkspaceEventType.AgentProposalApproved;
    return { type, summary: text, detail: null, actor: personActor(view) };
  }
  if (view.status === AgentProposalStatus.Rejected) {
    const text = AGENT_PROPOSAL_EVENT_COPY.rejected(agentName, summary);
    const type = WorkspaceEventType.AgentProposalRejected;
    return { type, summary: text, detail: null, actor: personActor(view) };
  }
  if (view.status !== AgentProposalStatus.Expired) return null;
  const text = AGENT_PROPOSAL_EVENT_COPY.expired(agentName, summary);
  const type = WorkspaceEventType.AgentProposalExpired;
  return { type, summary: text, detail: null, actor: SYSTEM_ACTOR };
}

function failedStep(view: AgentProposalView): StepEvent | null {
  if (view.status !== AgentProposalStatus.Failed) return null;
  const text = AGENT_PROPOSAL_EVENT_COPY.failed(view.agentName, view.summary);
  const type = WorkspaceEventType.AgentProposalFailed;
  return { type, summary: text, detail: view.result, actor: agentActor(view) };
}

/**
 * The events of one outside agent's proposal: received, then decided (approved, rejected or
 * expired), then failed if the API refused the approved change. An applied change is in the
 * activity log already, credited to the agent and the person who approved it.
 */
export function agentProposalEvents(view: AgentProposalView): WorkspaceEventDraft[] {
  const received: StepEvent = {
    type: WorkspaceEventType.AgentProposalReceived,
    summary: AGENT_PROPOSAL_EVENT_COPY.received(view.agentName, view.summary),
    detail: view.preview?.headline ?? null,
    actor: agentActor(view),
  };
  const decided = decidedStep(view);
  const decidedAt = view.decidedAt ?? (decided ? view.expiresAt : null);
  const failed = failedStep(view);
  return [
    draft(view, ProposalStep.Received, view.createdAt, received),
    ...(decided && decidedAt ? [draft(view, ProposalStep.Decided, decidedAt, decided)] : []),
    ...(failed && view.finishedAt
      ? [draft(view, ProposalStep.Failed, view.finishedAt, failed)]
      : []),
  ];
}
