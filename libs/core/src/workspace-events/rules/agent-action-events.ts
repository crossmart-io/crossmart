import {
  ActivityActorType,
  type AgentWorkerAction,
  type AgentWorkerTurn,
} from '@crossmart/database';
import { AGENT_WORKER_NAME } from '../../activity/entities/actor.js';
import type { AgentWorkerActionView } from '../../agent-worker/entities/agent-worker-views.js';
import { AgentWorkerActionStatus } from '../../agent-worker/enums/agent-worker-action-status.enum.js';
import { AgentWorkerToolKind } from '../../agent-worker/enums/agent-worker-tool-kind.enum.js';
import { toActionView } from '../../agent-worker/mappers/agent-worker.mapper.js';
import type { WorkspaceEventActor } from '../entities/workspace-event.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { eventId, type WorkspaceEventDraft } from './workspace-event-kinds.js';

export const AGENT_EVENT_PREFIX = 'agent';

/** The steps of one tool call, each its own event. */
enum AgentStep {
  Made = 'made',
  Decided = 'decided',
  Finished = 'finished',
}

/** How each step reads; the tool call's own summary follows. */
export const AGENT_EVENT_COPY = {
  read: (summary: string) => `Read: ${summary}`,
  proposed: (summary: string) => `Proposed: ${summary}`,
  refused: (summary: string) => `Could not propose: ${summary}`,
  approved: (summary: string) => `Approved: ${summary}`,
  rejected: (summary: string) => `Rejected: ${summary}`,
  expired: (summary: string) => `Dropped without a decision: ${summary}`,
  applied: (summary: string) => `Applied: ${summary}`,
  failed: (summary: string) => `Failed: ${summary}`,
  turnFailed: 'Crossmart Agent could not finish',
} as const;

const CROSSMART_AGENT: WorkspaceEventActor = {
  type: ActivityActorType.AGENT,
  name: null,
  agentName: AGENT_WORKER_NAME,
  approvedByName: null,
};

/** Statuses an approved change moves through. */
const APPROVED_STATUSES: readonly AgentWorkerActionStatus[] = [
  AgentWorkerActionStatus.Executing,
  AgentWorkerActionStatus.Executed,
  AgentWorkerActionStatus.ExecutionFailed,
];

/** Tool titles are not needed here: the stored summary already names the tool and its target. */
const KEEP_TOOL_NAME = (toolName: string): string => toolName;

type StepEvent = Pick<WorkspaceEventDraft, 'type' | 'summary' | 'detail' | 'failed'>;

/** One step of a tool call, at the time it was taken. */
interface ActionStep {
  conversationId: string;
  view: AgentWorkerActionView;
  step: AgentStep;
  at: Date;
}

function draft(
  { conversationId, view, step, at }: ActionStep,
  event: StepEvent,
): WorkspaceEventDraft {
  return {
    id: eventId(AGENT_EVENT_PREFIX, view.id, step),
    actor: CROSSMART_AGENT,
    refs: {
      connectionId: view.targets.connectionIds[0] ?? null,
      productId: view.targets.productIds[0] ?? null,
      conversationId,
      actionId: view.id,
    },
    itemCount: null,
    occurredAt: at,
    ...event,
  };
}

function madeStep(view: AgentWorkerActionView): StepEvent | null {
  if (view.kind === AgentWorkerToolKind.Read) return null;
  if (view.status === AgentWorkerActionStatus.Refused) {
    const summary = AGENT_EVENT_COPY.refused(view.summary);
    return { type: WorkspaceEventType.AgentChangeFailed, summary, detail: view.outcome };
  }
  const summary = AGENT_EVENT_COPY.proposed(view.summary);
  return { type: WorkspaceEventType.AgentChangeProposed, summary, detail: null };
}

function decidedStep(view: AgentWorkerActionView): StepEvent {
  if (APPROVED_STATUSES.includes(view.status)) {
    const summary = AGENT_EVENT_COPY.approved(view.summary);
    return { type: WorkspaceEventType.AgentChangeApproved, summary, detail: null };
  }
  const expired = view.status === AgentWorkerActionStatus.Expired;
  const summary = (expired ? AGENT_EVENT_COPY.expired : AGENT_EVENT_COPY.rejected)(view.summary);
  return { type: WorkspaceEventType.AgentChangeRejected, summary, detail: null };
}

function finishedStep(view: AgentWorkerActionView): StepEvent {
  if (view.kind === AgentWorkerToolKind.Read) {
    const summary = AGENT_EVENT_COPY.read(view.summary);
    const failed = view.isError || view.status === AgentWorkerActionStatus.Failed;
    return { type: WorkspaceEventType.AgentToolCalled, summary, detail: view.outcome, failed };
  }
  if (view.status === AgentWorkerActionStatus.Executed) {
    const summary = AGENT_EVENT_COPY.applied(view.summary);
    return { type: WorkspaceEventType.AgentChangeApplied, summary, detail: null };
  }
  const summary = AGENT_EVENT_COPY.failed(view.summary);
  return { type: WorkspaceEventType.AgentChangeFailed, summary, detail: view.outcome };
}

/**
 * The events of one tool call: a change is proposed, decided and (once approved) applied or
 * refused; a read is one event when it answers. Steps not taken yet have no event.
 */
export function agentActionEvents(action: AgentWorkerAction): WorkspaceEventDraft[] {
  const view = toActionView(action, KEEP_TOOL_NAME);
  const at = (step: AgentStep, time: Date): ActionStep => ({
    conversationId: action.conversationId,
    view,
    step,
    at: time,
  });
  const made = madeStep(view);
  return [
    ...(made ? [draft(at(AgentStep.Made, action.createdAt), made)] : []),
    ...(action.decidedAt && view.kind === AgentWorkerToolKind.Write
      ? [draft(at(AgentStep.Decided, action.decidedAt), decidedStep(view))]
      : []),
    ...(action.finishedAt
      ? [draft(at(AgentStep.Finished, action.finishedAt), finishedStep(view))]
      : []),
  ];
}

/** A turn that ended in an error, with the reason the person was shown. */
export function failedTurnEvent(turn: AgentWorkerTurn): WorkspaceEventDraft | null {
  if (!turn.finishedAt) return null;
  return {
    id: eventId(AGENT_EVENT_PREFIX, turn.id),
    type: WorkspaceEventType.AgentTurnFailed,
    summary: AGENT_EVENT_COPY.turnFailed,
    detail: turn.failureReason,
    actor: CROSSMART_AGENT,
    refs: { conversationId: turn.conversationId },
    itemCount: null,
    occurredAt: turn.finishedAt,
  };
}
