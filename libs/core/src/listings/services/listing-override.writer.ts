import { Injectable } from '@nestjs/common';
import type { ListingOverrideInput } from '../entities/listing-override.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingOverrideRepository } from '../repositories/listing-override.repository.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncJobQueue } from './sync-job.queue.js';

/** Where an override is saved: a product on a connection. */
export interface OverrideTarget {
  workspaceId: string;
  connectionId: string;
  productId: string;
}

/**
 * Saves a listing's overrides, creating a pending listing when the product has none on the
 * connection yet, and queues an update when the channel already holds the listing.
 */
@Injectable()
export class ListingOverrideWriter {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly overrides: ListingOverrideRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  async save(target: OverrideTarget, input: ListingOverrideInput): Promise<void> {
    const listing = await this.listings.ensurePrimary(
      target.workspaceId,
      target.connectionId,
      target.productId,
    );
    await this.overrides.replace(target.workspaceId, listing.id, input);
    await this.resync(target, listing);
  }

  async clear(target: OverrideTarget): Promise<void> {
    const listing = await this.listings.findPrimary(
      target.workspaceId,
      target.connectionId,
      target.productId,
    );
    if (!listing) return;
    await this.overrides.clear(target.workspaceId, listing.id);
    await this.resync(target, listing);
  }

  private async resync(target: OverrideTarget, listing: ListingSyncRecord): Promise<void> {
    if (listing.externalId) {
      await this.queue.enqueue([
        { ...target, kind: SyncJobKind.Content },
        { ...target, kind: SyncJobKind.Inventory },
      ]);
    }
  }
}
