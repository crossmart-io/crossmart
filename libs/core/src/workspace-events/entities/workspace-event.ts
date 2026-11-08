import type { ActivityActorType } from '@crossmart/database';
import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type { WorkspaceEventCategory } from '../enums/workspace-event-category.enum.js';
import type { WorkspaceEventSeverity } from '../enums/workspace-event-severity.enum.js';
import type { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';

/** Who caused the event. */
export interface WorkspaceEventActor {
  type: ActivityActorType;
  /** The person or API key; for an agent, the person it acted for. Null for Crossmart itself. */
  name: string | null;
  /** The agent's name ("Claude", "Crossmart Agent") for agent actions. */
  agentName: string | null;
  /** The person who approved an outside agent's proposal that made the change (ADR 0028). */
  approvedByName: string | null;
}

/** The records an event is about, so a client can point at them; null when not about one. */
export interface WorkspaceEventRefs {
  /** The store (channel connection). */
  connectionId: string | null;
  productId: string | null;
  orderId: string | null;
  webhookEndpointId: string | null;
  /** The Crossmart Agent conversation, and the tool call in it. */
  conversationId: string | null;
  actionId: string | null;
  /** An outside agent's proposal (ADR 0028). */
  proposalId: string | null;
}

export interface WorkspaceEvent {
  /** Stable across reads: the source, the record and the step. */
  id: string;
  type: WorkspaceEventType;
  category: WorkspaceEventCategory;
  severity: WorkspaceEventSeverity;
  /** One line, safe to show: "Published “Linen Shirt” on Outlet". */
  summary: string;
  /** More to read, such as the store's error or what a read found. */
  detail: string | null;
  actor: WorkspaceEventActor;
  refs: WorkspaceEventRefs;
  /** Items the event covered, such as stock levels corrected. */
  itemCount: number | null;
  occurredAt: Date;
}

/** Where a reader stands in the stream: the time and id of the last event it has. */
export interface WorkspaceEventPosition {
  occurredAt: Date;
  id: string;
}

/** Whose stream it is: the workspace, and what the reader may see in it. */
export interface WorkspaceEventScope {
  workspaceId: string;
  /** The signed-in person reading, whose own Crossmart Agent steps are included; null for keys and agents. */
  viewerUserId: string | null;
  /** The reader's permissions in the workspace; each source needs its own. */
  permissions: ReadonlySet<WorkspacePermission>;
}

/**
 * What to read from a source: events after `after` (exclusive) up to `until` (inclusive), the
 * oldest first, or, with no `after`, the newest ones since `since`.
 */
export interface WorkspaceEventWindow {
  after: WorkspaceEventPosition | null;
  since: Date;
  until: Date;
  limit: number;
}

export interface WorkspaceEventPage {
  /** Oldest first. */
  items: WorkspaceEvent[];
  /** Pass as `after` for what comes next. */
  cursor: string;
}
