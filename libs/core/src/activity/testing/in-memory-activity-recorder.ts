import type { ActivityEntry } from '../entities/activity-entry.js';
import type { Actor } from '../entities/actor.js';
import { ActivityRecorder } from '../services/activity-recorder.js';

export interface RecordedActivity {
  workspaceId: string;
  actor: Actor;
  entry: ActivityEntry;
}

/** Keeps events in memory, for unit tests of services that record activity. */
export class InMemoryActivityRecorder extends ActivityRecorder {
  readonly recorded: RecordedActivity[] = [];

  record(workspaceId: string, actor: Actor, entry: ActivityEntry): Promise<void> {
    this.recorded.push({ workspaceId, actor, entry });
    return Promise.resolve();
  }

  get entries(): ActivityEntry[] {
    return this.recorded.map((activity) => activity.entry);
  }
}
