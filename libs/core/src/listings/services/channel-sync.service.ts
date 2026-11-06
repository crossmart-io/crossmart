import { BadRequestException, Injectable } from '@nestjs/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { SyncRequestResult } from '../entities/listing-sync-job.js';
import { CONNECTION_NOT_SYNCABLE } from '../listings.constants.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncPlanner } from './sync-planner.js';
import { SyncRequestQueue } from './sync-request.queue.js';
import { connectionSubject } from '../../channels/rules/connection-subject.js';

const pluralRules = new Intl.PluralRules('en');

function productsQueued(count: number): string {
  return `${count} ${pluralRules.select(count) === 'one' ? 'product' : 'products'} queued`;
}

/** "Publish" / "Sync now" for a connection, and the listings it holds. */
@Injectable()
export class ChannelSyncService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly planner: SyncPlanner,
    private readonly requests: SyncRequestQueue,
    private readonly activity: ActivityRecorder,
  ) {}

  /**
   * Queues every selected product to be published or updated, and the rest to be delisted. Each
   * listing it queues is marked until its job finishes, so the store shows it publishing and
   * `SyncProgressService` can tell when the sync is done.
   */
  async requestSync(
    workspaceId: string,
    connectionId: string,
    actor: Actor,
  ): Promise<SyncRequestResult> {
    const connection = await this.connections.require(workspaceId, connectionId);
    if (connection.view.status !== ChannelConnectionStatus.CONNECTED) {
      throw new BadRequestException(CONNECTION_NOT_SYNCABLE);
    }
    const plan = await this.planner.plan(workspaceId, connection);
    await this.requests.enqueue({ workspaceId, connectionId }, [...plan.publish, ...plan.delist]);
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.ChannelSyncRequested,
      subject: connectionSubject(connection.view),
      itemCount: plan.publish.length,
      detail: productsQueued(plan.publish.length),
    });
    return { queued: plan.publish.length, delisting: plan.delist.length };
  }
}
