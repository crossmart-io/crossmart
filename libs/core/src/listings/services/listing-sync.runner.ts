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

  run(job: ListingSyncJob): Promise<void> {
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
      await this.failures.exhausted(listing.id, error);
    }
  }
}
