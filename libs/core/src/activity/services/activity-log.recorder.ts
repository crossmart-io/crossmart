import { Injectable, Logger } from '@nestjs/common';
import type { ActivityEntry } from '../entities/activity-entry.js';
import type { Actor } from '../entities/actor.js';
import { toActivityEventInput } from '../mappers/activity-event.mapper.js';
import { ActivityEventRepository } from '../repositories/activity-event.repository.js';
import { ActivityRecorder } from './activity-recorder.js';

/** Stores events in the database. Failures are logged by error name only, never with content. */
@Injectable()
export class ActivityLogRecorder extends ActivityRecorder {
  private readonly logger = new Logger(ActivityLogRecorder.name);

  constructor(private readonly events: ActivityEventRepository) {
    super();
  }

  async record(workspaceId: string, actor: Actor, entry: ActivityEntry): Promise<void> {
    try {
      await this.events.create(toActivityEventInput(workspaceId, actor, entry));
    } catch (error) {
      const reason = error instanceof Error ? error.name : typeof error;
      this.logger.error(`Could not record ${entry.action} in workspace ${workspaceId}: ${reason}`);
    }
  }
}
