import { Injectable } from '@nestjs/common';
import { toActivityEventView } from '../../activity/mappers/activity-event.mapper.js';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { WorkspaceEventRepository } from '../repositories/workspace-event.repository.js';
import {
  ACTIVITY_EVENT_PREFIX,
  fromActivityEvent,
  isViewersOwnAgentChange,
} from '../rules/activity-event-mapping.js';
import { SourceWindow } from '../rules/source-window.js';
import { toWorkspaceEvent } from '../rules/workspace-event-kinds.js';
import { WorkspaceEventSource } from './workspace-event-source.js';

/**
 * The activity log: people's and agents' changes (labelled with the agent or API key), listings
 * published or refused with the store's reason, stock reconciliation, store connections.
 */
@Injectable()
export class ActivityEventSource extends WorkspaceEventSource {
  readonly permission = WorkspacePermission.ViewActivity;

  constructor(private readonly repository: WorkspaceEventRepository) {
    super();
  }

  async read(scope: WorkspaceEventScope, window: WorkspaceEventWindow): Promise<WorkspaceEvent[]> {
    const records = await this.repository.activityEvents(
      scope.workspaceId,
      new SourceWindow(window, ACTIVITY_EVENT_PREFIX),
    );
    return records.flatMap((record) => {
      const view = toActivityEventView(record);
      if (!view || isViewersOwnAgentChange(view, scope.viewerUserId)) return [];
      return [toWorkspaceEvent(fromActivityEvent(view))];
    });
  }
}
