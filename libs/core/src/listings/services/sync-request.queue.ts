import { Injectable } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import {
  type ListingScope,
  ListingSyncRepository,
} from '../repositories/listing-sync.repository.js';
import { SyncJobQueue } from './sync-job.queue.js';

/**
 * Queues the jobs a merchant's sync or retry asks for, marking their listings as queued first
 * (so a fast job never finishes before its mark). The store shows them publishing, and its sync
 * progress counts them, until `ListingSyncRunner` settles each one.
 */
@Injectable()
export class SyncRequestQueue {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  async enqueue(scope: ListingScope, jobs: readonly ListingSyncJob[]): Promise<void> {
    const requestedAt = new Date();
    for (const batch of chunk(jobs, SELECTION_BATCH_SIZE)) {
      const productIds = [...new Set(batch.map((job) => job.productId))];
      await this.listings.markSyncRequested(scope, productIds, requestedAt);
      await this.queue.enqueue(batch);
    }
  }
}
