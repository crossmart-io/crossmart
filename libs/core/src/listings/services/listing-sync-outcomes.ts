import { Injectable } from '@nestjs/common';
import type { PublishedListing } from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import { ActivitySubjectType } from '../../activity/enums/activity-subject-type.enum.js';
import { ActivityRecorder } from '../../activity/services/activity-recorder.js';
import { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  type FailedListing,
  ListingSyncFailures,
  type StoreProduct,
} from './listing-sync-failures.js';

/** A listing a content sync wrote to, named for the activity log. */
export type SyncedListing = FailedListing & { connectionId: string; wasPublished: boolean };

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
    await this.listings.recordPublished(listing.listingId, {
      externalId: published.externalId,
      externalUrl: published.externalUrl,
      status: published.active ? ListingStatus.ACTIVE : ListingStatus.INACTIVE,
      variants: published.variants,
      mediaDigest,
      syncedAt,
    });
    await this.connections.markSynced(listing.workspaceId, listing.connectionId, syncedAt);
    const action = listing.wasPublished
      ? ActivityAction.ListingUpdated
      : ActivityAction.ListingPublished;
    await this.record(listing, action);
  }

  async delisted(listing: SyncedListing): Promise<void> {
    await this.listings.markDelisted(listing.listingId, new Date());
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
  async synced(listingId: string): Promise<void> {
    await this.listings.recordSynced(listingId, new Date());
  }

  /** Some items were rejected; the listing shows the first reason. */
  async partlyFailed(listingId: string, reason: string): Promise<void> {
    await this.listings.recordFailure(listingId, reason);
  }

  failed(listing: FailedListing, error: unknown): Promise<void> {
    return this.failures.handle(listing, error);
  }

  private record(listing: StoreProduct, action: ActivityAction): Promise<void> {
    return this.activity.record(listing.workspaceId, Actor.system(), {
      action,
      subject: {
        type: ActivitySubjectType.Product,
        id: listing.productId,
        label: listing.productTitle,
      },
      detail: listing.storeName,
    });
  }
}
