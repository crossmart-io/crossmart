import { Injectable, Logger } from '@nestjs/common';
import type { PublishRequirement } from '@crossmart/connectors';
import { ActivityOutcome, ListingStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { type ListingRef, ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  isRetryableSyncError,
  syncFailureReason,
  syncFailureRequirement,
} from '../rules/sync-failure-reason.js';

/** A product on a store, named for the activity log. */
export interface StoreProduct {
  workspaceId: string;
  productId: string;
  productTitle: string;
  storeName: string;
}

/** The listing a failed sync was about, for its record and the activity log. */
export interface FailedListing extends StoreProduct {
  listingId: string;
}

/**
 * Records why a sync failed on the listing, so the merchant sees it next to the listing.
 * Failures that a retry may fix (outages, rate limits) are rethrown for the queue to retry;
 * the others mark the listing in error and are logged as activity, once.
 */
@Injectable()
export class ListingSyncFailures {
  private readonly logger = new Logger(ListingSyncFailures.name);

  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly activity: ActivityRecorder,
  ) {}

  async handle(listing: FailedListing, error: unknown): Promise<void> {
    const reason = syncFailureReason(error);
    if (isRetryableSyncError(error)) {
      await this.listings.recordFailure(listing, reason);
      throw error;
    }
    await this.reject(listing, reason, syncFailureRequirement(error));
  }

  /**
   * A failure that will not go away by retrying: the listing is in error, logged once. A
   * `requirement` says the merchant must add something first.
   */
  async reject(
    listing: FailedListing,
    reason: string,
    requirement: PublishRequirement | null = null,
  ): Promise<void> {
    this.logger.warn(`Sync of listing ${listing.listingId} was rejected: ${reason}`);
    await this.listings.recordFailure(listing, reason, ListingStatus.ERROR, requirement);
    await this.recordFailed(listing, reason);
  }

  /**
   * Delisting a deleted product failed. There is no listing left to mark, so a failure a retry
   * may fix is rethrown, and the others are logged as activity for the merchant to act on.
   */
  async handleDeleted(product: StoreProduct, error: unknown): Promise<void> {
    if (isRetryableSyncError(error)) throw error;
    const reason = syncFailureReason(error);
    this.logger.warn(`Delisting deleted product ${product.productId} was rejected: ${reason}`);
    await this.recordFailed(product, reason);
  }

  private recordFailed(listing: StoreProduct, reason: string): Promise<void> {
    return this.activity.record(listing.workspaceId, Actor.system(), {
      action: ActivityAction.ListingSyncFailed,
      outcome: ActivityOutcome.FAILED,
      subject: {
        type: ActivitySubjectType.Product,
        id: listing.productId,
        label: listing.productTitle,
      },
      detail: listing.storeName,
      failureReason: reason,
    });
  }

  /** The queue gave up retrying: the listing is now in error. */
  async exhausted(listing: ListingRef, error: unknown): Promise<void> {
    await this.listings.recordFailure(listing, syncFailureReason(error), ListingStatus.ERROR);
  }
}
