import { Injectable } from '@nestjs/common';
import type { PublishedListing } from '@crossmart/connectors';
import { ActivityOutcome, ListingStatus } from '@crossmart/database';
import type { ActivityEntry } from '../../activity/entities/activity-entry.js';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { type ListingRef, ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  type FailedListing,
  ListingSyncFailures,
  type StoreProduct,
} from './listing-sync-failures.js';

/** A listing a content sync wrote to, named for the activity log. */
export type SyncedListing = FailedListing & { wasPublished: boolean };

/** Stores what a content sync did, on the listing, the connection and the activity log. */
@Injectable()
export class ListingSyncOutcomes {
  constructor(
    private readonly listings: ListingSyncRepository,
    private readonly connections: ChannelConnectionRepository,
    private readonly activity: ActivityRecorder,
    private readonly failures: ListingSyncFailures,
  ) {}

  async published(
    listing: SyncedListing,
    published: PublishedListing,
    mediaDigest: string,
  ): Promise<void> {
    const syncedAt = new Date();
    await this.listings.recordPublished(listing, {
      externalId: published.externalId,
      externalUrl: published.externalUrl,
      status: published.active ? ListingStatus.ACTIVE : ListingStatus.INACTIVE,
      variants: published.variants,
      mediaDigest,
      syncedAt,
      newlyPublished: !listing.wasPublished,
      ...(published.category
        ? {
            channelCategoryId: published.category.id,
            channelCategoryName: published.category.name,
          }
        : {}),
    });
    await this.connections.markSynced(listing.workspaceId, listing.connectionId, syncedAt);
    const action = listing.wasPublished
      ? ActivityAction.ListingUpdated
      : ActivityAction.ListingPublished;
    await this.record(listing, action);
  }

  async delisted(listing: SyncedListing): Promise<void> {
    await this.listings.markDelisted(listing, new Date());
    await this.record(listing, ActivityAction.ListingDelisted);
  }

  /** A deleted product was taken off the store; its listing went with it. */
  deletedDelisted(product: StoreProduct): Promise<void> {
    return this.record(product, ActivityAction.ListingDelisted);
  }

  deletedFailed(product: StoreProduct, error: unknown): Promise<void> {
    return this.failures.handleDeleted(product, error);
  }

  /** A price or stock sync went through. */
  async synced(listing: ListingRef): Promise<void> {
    await this.listings.recordSynced(listing, new Date());
  }

  /** Some items were rejected; the listing shows the first reason. */
  async partlyFailed(listing: ListingRef, reason: string): Promise<void> {
    await this.listings.recordFailure(listing, reason);
  }

  /**
   * A store refused some stock levels: the listing shows the first reason, and the activity log
   * says so once, not again while the listing already shows the same reason.
   */
  async stockPartlyFailed(
    listing: FailedListing,
    reason: string,
    previousError: string | null,
  ): Promise<void> {
    await this.listings.recordFailure(listing, reason);
    if (previousError === reason) return;
    await this.activity.record(listing.workspaceId, Actor.system(), {
      ...this.entryFor(listing, ActivityAction.StockSyncFailed),
      outcome: ActivityOutcome.FAILED,
      failureReason: reason,
    });
  }

  /** Reconciliation corrected `itemCount` items the store showed wrongly. */
  async reconciled(listing: FailedListing, itemCount: number): Promise<void> {
    await this.synced(listing);
    await this.activity.record(listing.workspaceId, Actor.system(), {
      ...this.entryFor(listing, ActivityAction.StockReconciled),
      itemCount,
    });
  }

  /** Crossmart itself refused the sync (the plan's limit); nothing was sent to the channel. */
  refused(listing: FailedListing, reason: string): Promise<void> {
    return this.failures.reject(listing, reason);
  }

  failed(listing: FailedListing, error: unknown): Promise<void> {
    return this.failures.handle(listing, error);
  }

  private record(listing: StoreProduct, action: ActivityAction): Promise<void> {
    return this.activity.record(
      listing.workspaceId,
      Actor.system(),
      this.entryFor(listing, action),
    );
  }

  /** An event about a product on a store: the product, named, and the store. */
  private entryFor(listing: StoreProduct, action: ActivityAction): ActivityEntry {
    return {
      action,
      subject: {
        type: ActivitySubjectType.Product,
        id: listing.productId,
        label: listing.productTitle,
      },
      detail: listing.storeName,
      connectionId: listing.connectionId,
    };
  }
}
