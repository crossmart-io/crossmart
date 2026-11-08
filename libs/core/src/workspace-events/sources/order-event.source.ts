import { Injectable } from '@nestjs/common';
import { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';
import { WorkspaceEventRepository } from '../repositories/workspace-event.repository.js';
import { ORDER_EVENT_PREFIX, orderReceivedEvent } from '../rules/order-events.js';
import { SourceWindow } from '../rules/source-window.js';
import { toWorkspaceEvent } from '../rules/workspace-event-kinds.js';
import { WorkspaceEventSource } from './workspace-event-source.js';

/** Orders as they arrive from the stores, for readers who may see orders. */
@Injectable()
export class OrderEventSource extends WorkspaceEventSource {
  readonly permission = WorkspacePermission.ViewOrders;

  constructor(private readonly repository: WorkspaceEventRepository) {
    super();
  }

  async read(scope: WorkspaceEventScope, window: WorkspaceEventWindow): Promise<WorkspaceEvent[]> {
    const orders = await this.repository.orders(
      scope.workspaceId,
      new SourceWindow(window, ORDER_EVENT_PREFIX),
    );
    return orders.map((order) => toWorkspaceEvent(orderReceivedEvent(order)));
  }
}
