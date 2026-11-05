import { Injectable } from '@nestjs/common';
import type { ItemSpecific } from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import type { StoredItemSpecifics } from '../entities/listing-item-specifics.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingItemSpecificsRepository } from '../repositories/listing-item-specifics.repository.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { listingCategory, listingItemSpecifics } from '../rules/listing-category.js';
import type { OverrideTarget } from './listing-override.writer.js';
import { SyncJobQueue } from './sync-job.queue.js';

/**
 * Whether saving item specifics sends the listing again: when the channel holds it, or when its
 * last publish failed (often for a missing item specific), so the publish is retried.
 */
function needsResend(listing: ListingSyncRecord): boolean {
  return listing.externalId !== null || listing.status === ListingStatus.ERROR;
}

/**
 * Stores a listing's item specifics, creating a pending listing when the product has none on
 * the connection yet, and sends the listing again when the channel holds it or refused it.
 */
@Injectable()
export class ListingItemSpecificsWriter {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly specifics: ListingItemSpecificsRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  /** The listing's category and item specifics; none before the product has a listing. */
  async current(target: OverrideTarget): Promise<StoredItemSpecifics> {
    const listing = await this.listings.findPrimary(
      target.workspaceId,
      target.connectionId,
      target.productId,
    );
    return {
      category: listingCategory(listing),
      values: listingItemSpecifics(listing),
    };
  }

  async save(target: OverrideTarget, specifics: ItemSpecific[]): Promise<void> {
    const listing = await this.listings.ensurePrimary(
      target.workspaceId,
      target.connectionId,
      target.productId,
    );
    await this.specifics.replace(target.workspaceId, listing.id, specifics);
    if (needsResend(listing)) {
      await this.queue.enqueue([{ ...target, kind: SyncJobKind.Content }]);
    }
  }
}
