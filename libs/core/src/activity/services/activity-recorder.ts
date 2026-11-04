import { ActivityOutcome } from '@crossmart/database';
import type { ActivityEntry } from '../entities/activity-entry.js';
import type { Actor } from '../entities/actor.js';
import { toFailureReason } from '../rules/failure-reason.js';

/**
 * Writes the activity log. Inject it in any service and call it after a write:
 *
 *     await this.activity.record(workspaceId, actor, { action: ActivityAction.ProductUpdated, ... });
 *
 * Recording never throws: a log that cannot be written must not undo or fail the operation.
 */
export abstract class ActivityRecorder {
  abstract record(workspaceId: string, actor: Actor, entry: ActivityEntry): Promise<void>;

  /** Records a failed operation, with a reason that is safe to show, then lets you rethrow. */
  recordFailure(
    workspaceId: string,
    actor: Actor,
    entry: ActivityEntry,
    error: unknown,
  ): Promise<void> {
    return this.record(workspaceId, actor, {
      ...entry,
      outcome: ActivityOutcome.FAILED,
      failureReason: toFailureReason(error),
    });
  }
}
