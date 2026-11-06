import { Injectable } from '@nestjs/common';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import {
  SYNC_REQUEST_STALE_AFTER_MS,
  SYNC_REQUEST_SWEEP_BATCH_SIZE,
} from '../listings.constants.js';
import {
  ListingSyncRepository,
  type SyncRequestRef,
} from '../repositories/listing-sync.repository.js';
import { syncJobKey } from './bull-sync-job.queue.js';
import { SyncJobQueue } from './sync-job.queue.js';

/** A content job publishes a selected product and delists one no longer selected. */
function settlingJob({ workspaceId, connectionId, productId }: SyncRequestRef): ListingSyncJob {
  return { kind: SyncJobKind.Content, workspaceId, connectionId, productId };
}

/** One job per product and store, however many of its listings are stale. */
function uniqueJobs(stale: readonly SyncRequestRef[]): ListingSyncJob[] {
  const jobs = new Map(stale.map((ref) => [syncJobKey(settlingJob(ref)), settlingJob(ref)]));
  return [...jobs.values()];
}

/**
 * Queues again the listings whose requested sync never ran. A job settles its listing's request
 * when it finishes or gives up, so a request older than `SYNC_REQUEST_STALE_AFTER_MS` lost its
 * job (a dropped catalog event, a flushed queue) and would show publishing forever. Each batch
 * is marked requested again before its jobs are queued, so the next sweep leaves it alone for
 * another full threshold. Running it twice queues nothing twice: the jobs are debounced per
 * listing, and a renewed request is no longer stale.
 */
@Injectable()
export class SyncRequestSweeper {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  /** How many listings were queued again. */
  async sweep(now: Date = new Date()): Promise<number> {
    const requestedBefore = new Date(now.getTime() - SYNC_REQUEST_STALE_AFTER_MS);
    let requeued = 0;
    let batch: SyncRequestRef[];
    do {
      batch = await this.listings.findStaleSyncRequests(
        requestedBefore,
        SYNC_REQUEST_SWEEP_BATCH_SIZE,
      );
      requeued += await this.requeue(batch, requestedBefore, now);
    } while (batch.length === SYNC_REQUEST_SWEEP_BATCH_SIZE);
    return requeued;
  }

  private async requeue(
    batch: readonly SyncRequestRef[],
    requestedBefore: Date,
    now: Date,
  ): Promise<number> {
    if (batch.length === 0) return 0;
    const ids = batch.map((ref) => ref.listingId);
    const renewed = await this.listings.renewSyncRequests(ids, requestedBefore, now);
    await this.queue.enqueue(uniqueJobs(batch));
    return renewed;
  }
}
