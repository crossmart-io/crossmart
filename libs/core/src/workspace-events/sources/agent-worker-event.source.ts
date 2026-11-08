import { Injectable } from '@nestjs/common';
import { SortDirection } from '@crossmart/common';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { WorkspaceEventRepository } from '../repositories/workspace-event.repository.js';
import { agentActionEvents, failedTurnEvent } from '../rules/agent-action-events.js';
import { comparePositions, isInWindow, positionOf } from '../rules/workspace-event-cursor.js';
import { toWorkspaceEvent } from '../rules/workspace-event-kinds.js';
import { WorkspaceEventSource } from './workspace-event-source.js';

/**
 * Crossmart Agent's steps in the reader's own conversations: reads, proposals, decisions and
 * results, and turns that failed. Conversations are private, so other people's never appear;
 * the changes they approve still reach the stream through the activity log.
 */
@Injectable()
export class AgentWorkerEventSource extends WorkspaceEventSource {
  readonly permission = WorkspacePermission.UseAgentWorker;

  constructor(private readonly repository: WorkspaceEventRepository) {
    super();
  }

  async read(scope: WorkspaceEventScope, window: WorkspaceEventWindow): Promise<WorkspaceEvent[]> {
    if (!scope.viewerUserId) return [];
    const since = window.after?.occurredAt ?? window.since;
    const conversationIds = await this.repository.activeConversationIds(
      scope.workspaceId,
      scope.viewerUserId,
      since,
    );
    const direction = window.after ? SortDirection.Asc : SortDirection.Desc;
    const [actions, turns] = await Promise.all([
      this.repository.agentActions({
        conversationIds,
        since,
        until: window.until,
        limit: window.limit,
        direction,
      }),
      this.repository.failedTurns(conversationIds, since, window.until),
    ]);
    const drafts = [
      ...actions.flatMap((action) => agentActionEvents(action)),
      ...turns.flatMap((turn) => failedTurnEvent(turn) ?? []),
    ];
    return this.inWindow(drafts.map(toWorkspaceEvent), window);
  }

  /** Steps of a call can fall outside the window; keep those inside, in the window's order. */
  private inWindow(events: WorkspaceEvent[], window: WorkspaceEventWindow): WorkspaceEvent[] {
    const sign = window.after ? 1 : -1;
    return events
      .filter((event) => isInWindow(event, window.after, window.since, window.until))
      .sort((left, right) => sign * comparePositions(positionOf(left), positionOf(right)))
      .slice(0, window.limit);
  }
}
