import { Injectable } from '@nestjs/common';
import type { RateLimitBucket } from '@crossmart/connectors';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ListingContentSync } from './listing-content.sync.js';
import { ListingInventorySync } from './listing-inventory.sync.js';
import { ListingPriceSync } from './listing-price.sync.js';
import { ListingSyncFailures } from './listing-sync-failures.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';

/** Jobs that publish, update or delist a listing: the ones a sync or retry waits for. */
const SETTLING_JOB_KINDS: ReadonlySet<ListingSyncJob['kind']> = new Set([
  SyncJobKind.Content,
  SyncJobKind.Delist,
]);

/** The executors of each job kind, grouped so the runner stays small. */
@Injectable()
export class ListingSyncExecutors {
  constructor(
    readonly content: ListingContentSync,
    readonly price: ListingPriceSync,
    readonly inventory: ListingInventorySync,
  ) {}
}

/** Runs one sync job, whatever its kind. The worker's processors call it. */
@Injectable()
export class ListingSyncRunner {
  constructor(
    private readonly executors: ListingSyncExecutors,
    private readonly connections: SyncConnectionLoader,
    private readonly listings: ListingSyncRepository,
    private readonly failures: ListingSyncFailures,
  ) {}

  /**
   * Runs the job. A content or delist job that finished settles what a sync or retry queued for
   * its listing; one that throws is retried, and settles once it finishes or gives up.
   */
  async run(job: ListingSyncJob): Promise<void> {
    await this.execute(job);
    await this.settle(job);
  }

  private execute(job: ListingSyncJob): Promise<void> {
    switch (job.kind) {
      case SyncJobKind.Content:
        return this.executors.content.publish(job);
      case SyncJobKind.Delist:
        return this.executors.content.delist(job);
      case SyncJobKind.Price:
        return this.executors.price.run(job);
      case SyncJobKind.Inventory:
        return this.executors.inventory.run(job);
    }
  }

  /** Clears the listing's sync request once a job that publishes or delists it is over. */
  private async settle(job: ListingSyncJob): Promise<void> {
    if (!SETTLING_JOB_KINDS.has(job.kind)) return;
    const { workspaceId, connectionId, productId } = job;
    await this.listings.clearSyncRequest({ workspaceId, connectionId }, productId);
  }

  /** The rate-limit buckets of the job's connection, so the worker can pace its calls. */
  async rateLimitsOf(job: ListingSyncJob): Promise<readonly RateLimitBucket[]> {
    const connection = await this.connections.load(job.workspaceId, job.connectionId);
    return connection?.connector.rateLimits ?? [];
  }

  /** The queue gave up on the job: its listing is marked in error with the last reason. */
  async exhausted(job: ListingSyncJob, error: unknown): Promise<void> {
    const listing = await this.listings.findPrimary(
      job.workspaceId,
      job.connectionId,
      job.productId,
    );
    if (listing) {
      await this.failures.exhausted({ workspaceId: job.workspaceId, listingId: listing.id }, error);
    }
    await this.settle(job);
  }
}
