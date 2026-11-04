import { Injectable } from '@nestjs/common';
import type { ChannelCategory } from '@crossmart/connectors';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import type { OverrideTarget } from './listing-override.writer.js';
import { SyncJobQueue } from './sync-job.queue.js';

/**
 * Puts a listing in a channel category, creating a pending listing when the product has none
 * on the connection yet, and queues an update when the channel already holds the listing.
 */
@Injectable()
export class ListingCategoryWriter {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  async save(target: OverrideTarget, category: ChannelCategory | null): Promise<void> {
    const listing = await this.listings.ensurePrimary(
      target.workspaceId,
      target.connectionId,
      target.productId,
    );
    await this.listings.saveCategory(listing.id, category);
    if (listing.externalId) {
      await this.queue.enqueue([{ ...target, kind: SyncJobKind.Content }]);
    }
  }
}
