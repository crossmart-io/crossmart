import { Injectable } from '@nestjs/common';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { WorkspaceEventRepository } from '../repositories/workspace-event.repository.js';
import { SourceWindow } from '../rules/source-window.js';
import { WEBHOOK_EVENT_PREFIX, webhookFailureEvent } from '../rules/webhook-failure-events.js';
import { toWorkspaceEvent } from '../rules/workspace-event-kinds.js';
import { WorkspaceEventSource } from './workspace-event-source.js';

/** Webhook deliveries that gave up, for readers who manage webhooks (they see the endpoints). */
@Injectable()
export class WebhookFailureEventSource extends WorkspaceEventSource {
  readonly permission = WorkspacePermission.ManageWebhooks;

  constructor(private readonly repository: WorkspaceEventRepository) {
    super();
  }

  async read(scope: WorkspaceEventScope, window: WorkspaceEventWindow): Promise<WorkspaceEvent[]> {
    const deliveries = await this.repository.failedDeliveries(
      scope.workspaceId,
      new SourceWindow(window, WEBHOOK_EVENT_PREFIX),
    );
    return deliveries.map((delivery) => toWorkspaceEvent(webhookFailureEvent(delivery)));
  }
}
