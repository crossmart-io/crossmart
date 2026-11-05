import { BadRequestException, Injectable } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import { ChannelConnectionStatus } from '@crossmart/database';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { SyncRequestResult } from '../entities/listing-sync-job.js';
import { CONNECTION_NOT_SYNCABLE, SELECTION_BATCH_SIZE } from '../listings.constants.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncJobQueue } from './sync-job.queue.js';
import { SyncPlanner } from './sync-planner.js';
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
    private readonly queue: SyncJobQueue,
    private readonly activity: ActivityRecorder,
  ) {}

  /** Queues every selected product to be published or updated, and the rest to be delisted. */
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
    for (const batch of chunk([...plan.publish, ...plan.delist], SELECTION_BATCH_SIZE)) {
      await this.queue.enqueue(batch);
    }
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.ChannelSyncRequested,
      subject: connectionSubject(connection.view),
      itemCount: plan.publish.length,
      detail: productsQueued(plan.publish.length),
    });
    return { queued: plan.publish.length, delisting: plan.delist.length };
  }
}
