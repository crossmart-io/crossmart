import { Injectable } from '@nestjs/common';
import { SortDirection } from '@crossmart/common';
import { toProposalView } from '../../agent-proposals/mappers/agent-proposal.mapper.js';
import { proposalToolTitle } from '../../agent-proposals/rules/proposal-tools.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { WorkspaceEventRepository } from '../repositories/workspace-event.repository.js';
import { agentProposalEvents } from '../rules/agent-proposal-events.js';
import { comparePositions, isInWindow, positionOf } from '../rules/workspace-event-cursor.js';
import { toWorkspaceEvent } from '../rules/workspace-event-kinds.js';
import { WorkspaceEventSource } from './workspace-event-source.js';

/**
 * Outside agents' proposals (ADR 0028): received, decided, expired or failed. Whoever may see
 * the proposals inbox sees them, as they are what waits for a decision in the workspace.
 */
@Injectable()
export class AgentProposalEventSource extends WorkspaceEventSource {
  readonly permission = WorkspacePermission.ViewSuggestions;

  constructor(private readonly repository: WorkspaceEventRepository) {
    super();
  }

  async read(scope: WorkspaceEventScope, window: WorkspaceEventWindow): Promise<WorkspaceEvent[]> {
    const now = new Date();
    const records = await this.repository.agentProposals({
      workspaceId: scope.workspaceId,
      since: window.after?.occurredAt ?? window.since,
      until: window.until,
      limit: window.limit,
      direction: window.after ? SortDirection.Asc : SortDirection.Desc,
    });
    const drafts = records.flatMap((record) =>
      agentProposalEvents(toProposalView(record, proposalToolTitle, now)),
    );
    const sign = window.after ? 1 : -1;
    return drafts
      .map(toWorkspaceEvent)
      .filter((event) => isInWindow(event, window.after, window.since, window.until))
      .sort((left, right) => sign * comparePositions(positionOf(left), positionOf(right)))
      .slice(0, window.limit);
  }
}
