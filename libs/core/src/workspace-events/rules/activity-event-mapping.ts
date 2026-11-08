import { ActivityActorType, ActivityOutcome } from '@crossmart/database';
import type { ActivityEventView } from '../../activity/entities/activity-event-view.js';
import { AGENT_WORKER_NAME } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';
import { eventId, type WorkspaceEventDraft } from './workspace-event-kinds.js';

export const ACTIVITY_EVENT_PREFIX = 'activity';

/** Activity log actions the stream names by their own type; the rest are changes by someone. */
const ACTIVITY_EVENT_TYPES: Partial<Record<ActivityAction, WorkspaceEventType>> = {
  [ActivityAction.ListingPublished]: WorkspaceEventType.ListingPublished,
  [ActivityAction.ListingUpdated]: WorkspaceEventType.ListingUpdated,
  [ActivityAction.ListingSyncFailed]: WorkspaceEventType.ListingFailed,
  [ActivityAction.ListingDelisted]: WorkspaceEventType.ListingDelisted,
  [ActivityAction.StockReconciled]: WorkspaceEventType.StockReconciled,
  [ActivityAction.StockSyncFailed]: WorkspaceEventType.StockSyncFailed,
  [ActivityAction.StockOversold]: WorkspaceEventType.StockOversold,
  [ActivityAction.ChannelConnected]: WorkspaceEventType.StoreConnected,
  [ActivityAction.ChannelDisconnected]: WorkspaceEventType.StoreDisconnected,
  [ActivityAction.ChannelConnectFailed]: WorkspaceEventType.StoreConnectFailed,
  [ActivityAction.WebhookEndpointDisabled]: WorkspaceEventType.WebhookEndpointDisabled,
};

/** Agents over MCP and programs with an API key: the "other agents" of the stream. */
const AUTOMATED_ACTORS: readonly ActivityActorType[] = [
  ActivityActorType.AGENT,
  ActivityActorType.API_KEY,
];

function typeOf(view: ActivityEventView): WorkspaceEventType {
  const own = ACTIVITY_EVENT_TYPES[view.action];
  if (own) return own;
  return AUTOMATED_ACTORS.includes(view.actor.type)
    ? WorkspaceEventType.AgentActivity
    : WorkspaceEventType.WorkspaceChange;
}

function subjectIdOf(view: ActivityEventView, type: ActivitySubjectType): string | null {
  return view.subject?.type === type ? view.subject.id : null;
}

/**
 * Whether Crossmart Agent made the change for the reader: their own conversation already shows it
 * as an applied change, so the activity log's copy is left out.
 */
export function isViewersOwnAgentChange(
  view: ActivityEventView,
  viewerUserId: string | null,
): boolean {
  return (
    viewerUserId !== null &&
    view.actor.type === ActivityActorType.AGENT &&
    view.actor.agentName === AGENT_WORKER_NAME &&
    view.actor.userId === viewerUserId
  );
}

/** An activity log event as the stream shows it, with the store and product it points at. */
export function fromActivityEvent(view: ActivityEventView): WorkspaceEventDraft {
  return {
    id: eventId(ACTIVITY_EVENT_PREFIX, view.id),
    type: typeOf(view),
    summary: view.summary,
    detail: view.failureReason,
    actor: { type: view.actor.type, name: view.actor.name, agentName: view.actor.agentName },
    refs: {
      connectionId: view.connectionId,
      productId: subjectIdOf(view, ActivitySubjectType.Product),
      webhookEndpointId: subjectIdOf(view, ActivitySubjectType.WebhookEndpoint),
    },
    itemCount: view.itemCount,
    occurredAt: view.createdAt,
    failed: view.outcome === ActivityOutcome.FAILED,
  };
}
