import { EVENT_ID_SEPARATOR } from '../workspace-events.constants.js';
import type { WorkspaceEvent, WorkspaceEventRefs } from '../entities/workspace-event.js';
import { WorkspaceEventCategory } from '../enums/workspace-event-category.enum.js';
import { WorkspaceEventSeverity } from '../enums/workspace-event-severity.enum.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';

interface EventKind {
  category: WorkspaceEventCategory;
  /** How the type reads when nothing failed; a failure always reads as an error. */
  severity: WorkspaceEventSeverity;
}

const { Agent, Stores, Orders, Workspace } = WorkspaceEventCategory;
const { Info, Success, Warning, Error } = WorkspaceEventSeverity;

/** The group and tone of every event type. */
export const WORKSPACE_EVENT_KINDS: Record<WorkspaceEventType, EventKind> = {
  [WorkspaceEventType.AgentToolCalled]: { category: Agent, severity: Info },
  [WorkspaceEventType.AgentChangeProposed]: { category: Agent, severity: Warning },
  [WorkspaceEventType.AgentChangeApproved]: { category: Agent, severity: Info },
  [WorkspaceEventType.AgentChangeRejected]: { category: Agent, severity: Info },
  [WorkspaceEventType.AgentChangeApplied]: { category: Agent, severity: Success },
  [WorkspaceEventType.AgentChangeFailed]: { category: Agent, severity: Error },
  [WorkspaceEventType.AgentTurnFailed]: { category: Agent, severity: Error },
  [WorkspaceEventType.AgentActivity]: { category: Agent, severity: Info },
  [WorkspaceEventType.ListingPublished]: { category: Stores, severity: Success },
  [WorkspaceEventType.ListingUpdated]: { category: Stores, severity: Info },
  [WorkspaceEventType.ListingFailed]: { category: Stores, severity: Error },
  [WorkspaceEventType.ListingDelisted]: { category: Stores, severity: Info },
  [WorkspaceEventType.StockReconciled]: { category: Stores, severity: Info },
  [WorkspaceEventType.StockSyncFailed]: { category: Stores, severity: Error },
  [WorkspaceEventType.StockOversold]: { category: Orders, severity: Error },
  [WorkspaceEventType.OrderReceived]: { category: Orders, severity: Success },
  [WorkspaceEventType.StoreConnected]: { category: Stores, severity: Success },
  [WorkspaceEventType.StoreDisconnected]: { category: Stores, severity: Warning },
  [WorkspaceEventType.StoreConnectFailed]: { category: Stores, severity: Error },
  [WorkspaceEventType.WebhookDeliveryFailed]: { category: Workspace, severity: Error },
  [WorkspaceEventType.WebhookEndpointDisabled]: { category: Workspace, severity: Error },
  [WorkspaceEventType.WorkspaceChange]: { category: Workspace, severity: Info },
};

export const NO_REFS: WorkspaceEventRefs = {
  connectionId: null,
  productId: null,
  orderId: null,
  webhookEndpointId: null,
  conversationId: null,
  actionId: null,
};

/** What a source knows about an event; the kind table fills in its group and tone. */
export type WorkspaceEventDraft = Omit<WorkspaceEvent, 'category' | 'severity' | 'refs'> & {
  refs?: Partial<WorkspaceEventRefs>;
  /** The operation failed: it reads as an error whatever its type. */
  failed?: boolean;
};

export function toWorkspaceEvent({ failed, refs, ...draft }: WorkspaceEventDraft): WorkspaceEvent {
  const kind = WORKSPACE_EVENT_KINDS[draft.type];
  return {
    ...draft,
    category: kind.category,
    severity: failed ? WorkspaceEventSeverity.Error : kind.severity,
    refs: { ...NO_REFS, ...refs },
  };
}

/** `activity:<id>`, `agent:<id>:proposed`: ids that never collide across sources or steps. */
export function eventId(...parts: string[]): string {
  return parts.join(EVENT_ID_SEPARATOR);
}
