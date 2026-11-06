import { Injectable } from '@nestjs/common';
import type { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import type { ListingRequeue } from '../entities/listing-retry.js';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ActiveListingsGate } from './active-listings.gate.js';
import { SyncRequestQueue } from './sync-request.queue.js';

/** A retry publishes the whole listing again, then sends its stock, as adding it does. */
const RETRY_JOB_KINDS: readonly ListingSyncJob['kind'][] = [
  SyncJobKind.Content,
  SyncJobKind.Inventory,
];

/**
 * Puts one product's publish to one store back on the sync queues. Its listing becomes pending
 * at once (a failed one loses its error) and is marked queued until its publish finishes, so the
 * store shows it publishing, even when it was published already. Refused (402)
 * before any write when the plan has no room for the active listing it would add.
 */
@Injectable()
export class ListingRequeuer {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly gate: ActiveListingsGate,
    private readonly requests: SyncRequestQueue,
    private readonly activity: ActivityRecorder,
  ) {}

  async requeue(retry: ListingRequeue, actor: Actor): Promise<void> {
    const { workspaceId, connectionId, productId } = retry;
    await this.gate.assertRoomFor({ workspaceId, connectionId }, { workspaceId, id: productId });
    const listing = await this.listings.ensurePrimary(workspaceId, connectionId, productId);
    await this.listings.markForRetry({ workspaceId, listingId: listing.id });
    await this.requests.enqueue(
      { workspaceId, connectionId },
      RETRY_JOB_KINDS.map((kind) => ({ kind, workspaceId, connectionId, productId })),
    );
    await this.activity.record(workspaceId, actor, {
      action: ActivityAction.ListingRetryRequested,
      subject: { type: ActivitySubjectType.Product, id: productId, label: retry.productTitle },
      detail: retry.storeName,
    });
  }
}
