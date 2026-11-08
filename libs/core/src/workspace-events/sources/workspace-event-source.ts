import type { WorkspacePermission } from '../../tenancy/enums/workspace-permission.enum.js';
import type {
  WorkspaceEvent,
  WorkspaceEventScope,
  WorkspaceEventWindow,
} from '../entities/workspace-event.js';

/**
 * One kind of record the event stream reads (ADR 0027): the activity log, Crossmart Agent's
 * tool calls, orders, webhook deliveries. A source reads its own tables, never writes, and
 * returns at most `window.limit` events in the window: the oldest first after a position, or
 * the newest without one. It is only asked when the reader holds `permission`.
 */
export abstract class WorkspaceEventSource {
  abstract readonly permission: WorkspacePermission;

  abstract read(
    scope: WorkspaceEventScope,
    window: WorkspaceEventWindow,
  ): Promise<WorkspaceEvent[]>;
}
