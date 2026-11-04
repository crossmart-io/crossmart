import { Injectable } from '@nestjs/common';
import {
  ChannelCapability,
  type ChannelConnector,
  type ListingPublisher,
  supportsCapability,
} from '@crossmart/connectors';
import type { DeletedProductListing, ListingSyncJob } from '../entities/listing-sync-job.js';
import { ListingDraftBuilder } from './listing-draft.builder.js';
import { type SyncedListing, ListingSyncOutcomes } from './listing-sync-outcomes.js';
import { type ListingTarget, ListingTargetResolver } from './listing-target.resolver.js';
import { type SyncConnection, SyncConnectionLoader } from './sync-connection.loader.js';
import { ListingTargetAction } from '../enums/listing-target-action.enum.js';

type PublishTarget = Extract<ListingTarget, { action: ListingTargetAction.Publish }>;
type DelistTarget = Extract<ListingTarget, { action: ListingTargetAction.Delist }>;
type PublishingConnection = SyncConnection & { connector: ChannelConnector & ListingPublisher };

function canPublish(connection: SyncConnection | null): connection is PublishingConnection {
  return (
    connection !== null &&
    supportsCapability(connection.connector, ChannelCapability.PublishListings)
  );
}

/**
 * Publishes a product to a channel, or updates the listing it already has there, so running
 * it again never creates a duplicate. A product that is no longer selected is delisted.
 */
@Injectable()
export class ListingContentSync {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly targets: ListingTargetResolver,
    private readonly builder: ListingDraftBuilder,
    private readonly outcomes: ListingSyncOutcomes,
  ) {}

  async publish(job: ListingSyncJob): Promise<void> {
    const connection = await this.connections.load(job.workspaceId, job.connectionId);
    if (!canPublish(connection)) return;
    const target = await this.targets.forPublish(job, connection);
    await this.apply(job, connection, target);
  }

  async delist(job: ListingSyncJob): Promise<void> {
    const connection = await this.connections.load(job.workspaceId, job.connectionId);
    if (!canPublish(connection)) return;
    const target = await this.targets.forDelist(job);
    if (target.action === ListingTargetAction.Skip && job.deleted) {
      return this.takeDownDeleted(job, connection, job.deleted);
    }
    await this.apply(job, connection, target);
  }

  private apply(
    job: ListingSyncJob,
    connection: PublishingConnection,
    target: ListingTarget,
  ): Promise<void> {
    switch (target.action) {
      case ListingTargetAction.Publish:
        return this.send(job, connection, target);
      case ListingTargetAction.Delist:
        return this.takeDown(job, connection, target);
      case ListingTargetAction.Skip:
        return Promise.resolve();
    }
  }

  private async send(
    job: ListingSyncJob,
    connection: PublishingConnection,
    { product, listing }: PublishTarget,
  ): Promise<void> {
    const synced = this.describe(job, connection, listing, product.title);
    const { draft, mediaDigest } = this.builder.build({
      product,
      listing,
      pricing: connection.pricing,
      account: connection.view.settings.account,
    });
    try {
      const session = await this.connections.openSession(job.workspaceId, job.connectionId);
      const published = listing.externalId
        ? await connection.connector.update(session, listing.externalId, draft)
        : await connection.connector.publish(session, draft);
      await this.outcomes.published(synced, published, mediaDigest);
    } catch (error) {
      await this.outcomes.failed(synced, error);
    }
  }

  private async takeDown(
    job: ListingSyncJob,
    connection: PublishingConnection,
    { product, listing }: DelistTarget,
  ): Promise<void> {
    const synced = this.describe(job, connection, listing, product?.title ?? '');
    try {
      const session = await this.connections.openSession(job.workspaceId, job.connectionId);
      await connection.connector.delist(session, listing.externalId, {
        productId: job.productId,
        variantExternalIds: listing.variants.map((variant) => variant.externalId),
      });
      await this.outcomes.delisted(synced);
    } catch (error) {
      await this.outcomes.failed(synced, error);
    }
  }

  /** The product was deleted with its listing, so the job carries the id the channel gave it. */
  private async takeDownDeleted(
    job: ListingSyncJob,
    connection: PublishingConnection,
    deleted: DeletedProductListing,
  ): Promise<void> {
    const product = {
      workspaceId: job.workspaceId,
      productId: job.productId,
      productTitle: deleted.productTitle,
      storeName: connection.view.displayName,
    };
    try {
      const session = await this.connections.openSession(job.workspaceId, job.connectionId);
      await connection.connector.delist(session, deleted.externalId, {
        productId: job.productId,
        variantExternalIds: deleted.variantExternalIds ?? [],
      });
      await this.outcomes.deletedDelisted(product);
    } catch (error) {
      await this.outcomes.deletedFailed(product, error);
    }
  }

  private describe(
    job: ListingSyncJob,
    connection: SyncConnection,
    listing: { id: string; externalId: string | null },
    productTitle: string,
  ): SyncedListing {
    return {
      workspaceId: job.workspaceId,
      connectionId: job.connectionId,
      productId: job.productId,
      listingId: listing.id,
      productTitle,
      storeName: connection.view.displayName,
      wasPublished: listing.externalId !== null,
    };
  }
}
