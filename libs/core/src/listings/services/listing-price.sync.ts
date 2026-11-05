import { Injectable } from '@nestjs/common';
import { ChannelCapability, supportsCapability } from '@crossmart/connectors';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { ListingDraftBuilder } from './listing-draft.builder.js';
import { ListingSyncOutcomes } from './listing-sync-outcomes.js';
import { ListingTargetResolver } from './listing-target.resolver.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';

/** Sends a listing's channel prices only: cheaper than a full update after a price change. */
@Injectable()
export class ListingPriceSync {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly targets: ListingTargetResolver,
    private readonly builder: ListingDraftBuilder,
    private readonly outcomes: ListingSyncOutcomes,
  ) {}

  async run(job: ListingSyncJob): Promise<void> {
    const connection = await this.connections.load(job.workspaceId, job.connectionId);
    if (!connection || !supportsCapability(connection.connector, ChannelCapability.UpdatePrice)) {
      return;
    }
    const target = await this.targets.forPriceUpdate(job);
    if (!target) return;
    const updates = this.builder.priceUpdates(target.product, target.listing, connection.pricing);
    try {
      const session = await this.connections.openSession(job.workspaceId, job.connectionId);
      await connection.connector.updatePrices(session, updates);
      await this.outcomes.synced({ workspaceId: job.workspaceId, listingId: target.listing.id });
    } catch (error) {
      await this.outcomes.failed(
        {
          workspaceId: job.workspaceId,
          listingId: target.listing.id,
          productId: job.productId,
          productTitle: target.product.title,
          storeName: connection.view.displayName,
        },
        error,
      );
    }
  }
}
