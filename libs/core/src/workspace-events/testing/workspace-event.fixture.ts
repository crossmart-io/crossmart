import { ActivityActorType } from '@crossmart/database';
import type { WorkspaceEvent } from '../entities/workspace-event.js';
import { WorkspaceEventCategory } from '../enums/workspace-event-category.enum.js';
import { WorkspaceEventSeverity } from '../enums/workspace-event-severity.enum.js';
import { WorkspaceEventType } from '../enums/workspace-event-type.enum.js';

/** A workspace event for tests: a person's change, unless the overrides say otherwise. */
export function workspaceEvent(overrides: Partial<WorkspaceEvent> = {}): WorkspaceEvent {
  return {
    id: 'activity:1',
    type: WorkspaceEventType.WorkspaceChange,
    category: WorkspaceEventCategory.Workspace,
    severity: WorkspaceEventSeverity.Info,
    summary: 'Updated product “Mug”',
    detail: null,
    actor: { type: ActivityActorType.USER, name: 'Dana', agentName: null },
    refs: {
      connectionId: null,
      productId: null,
      orderId: null,
      webhookEndpointId: null,
      conversationId: null,
      actionId: null,
    },
    itemCount: null,
    occurredAt: new Date('2026-11-08T10:00:00.000Z'),
    ...overrides,
  };
}
