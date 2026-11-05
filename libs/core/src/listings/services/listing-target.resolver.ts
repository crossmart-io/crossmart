import { Injectable } from '@nestjs/common';
import { ListingStatus } from '@crossmart/database';
import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ProductSelectionService } from './product-selection.service.js';
import type { SyncConnection } from './sync-connection.loader.js';
import { SyncProductLoader } from './sync-product.loader.js';
import { ListingTargetAction } from '../enums/listing-target-action.enum.js';
import { wouldGoLive } from '../rules/listing-visibility.js';
import { ActiveListingsGate } from './active-listings.gate.js';

/** What a content job should do with its product on the channel. */
export type ListingTarget =
  | { action: ListingTargetAction.Publish; product: ProductDetail; listing: ListingSyncRecord }
  | {
      action: ListingTargetAction.Delist;
      product: ProductDetail | null;
      listing: ListingSyncRecord & { externalId: string };
    }
  | { action: ListingTargetAction.Skip }
  | {
      action: ListingTargetAction.Blocked;
      product: ProductDetail;
      listing: ListingSyncRecord;
      /** Why, for the listing and the activity log. */
      reason: string;
    };

const SKIP: ListingTarget = { action: ListingTargetAction.Skip };

function isOnChannel(
  listing: ListingSyncRecord | null,
): listing is ListingSyncRecord & { externalId: string } {
  return Boolean(listing?.externalId) && listing?.status !== ListingStatus.DELISTED;
}

/**
 * Decides whether a product is published (it exists and the connection's selection includes
 * it) or delisted (the channel holds it but it is no longer selected). A publish that would add
 * an active listing past the plan's limit is blocked instead.
 */
@Injectable()
export class ListingTargetResolver {
  constructor(
    private readonly products: SyncProductLoader,
    private readonly selection: ProductSelectionService,
    private readonly listings: ListingSyncRepository,
    private readonly gate: ActiveListingsGate,
  ) {}

  async forPublish(job: ListingSyncJob, connection: SyncConnection): Promise<ListingTarget> {
    const product = await this.products.find(job.workspaceId, job.productId);
    const selected =
      product !== null &&
      (await this.selection.includes(
        {
          workspaceId: job.workspaceId,
          connectionId: job.connectionId,
          rule: connection.view.settings.productSelection,
        },
        job.productId,
      ));
    if (!product || !selected) {
      return this.forDelist(job, product);
    }
    const listing = await this.listings.ensurePrimary(
      job.workspaceId,
      job.connectionId,
      job.productId,
    );
    return this.publishOrBlock(job, product, listing);
  }

  async forDelist(job: ListingSyncJob, known?: ProductDetail | null): Promise<ListingTarget> {
    const listing = await this.listings.findPrimary(
      job.workspaceId,
      job.connectionId,
      job.productId,
    );
    if (!isOnChannel(listing)) return SKIP;
    const product =
      known === undefined ? await this.products.find(job.workspaceId, job.productId) : known;
    return { action: ListingTargetAction.Delist, product, listing };
  }

  private async publishOrBlock(
    job: ListingSyncJob,
    product: ProductDetail,
    listing: ListingSyncRecord,
  ): Promise<ListingTarget> {
    const refusal = wouldGoLive(product, listing)
      ? await this.gate.refusalForOneMore(job.workspaceId)
      : null;
    return refusal
      ? { action: ListingTargetAction.Blocked, product, listing, reason: refusal.message }
      : { action: ListingTargetAction.Publish, product, listing };
  }

  /** The product and its listing, when the channel holds the listing; for price syncs. */
  async forPriceUpdate(job: ListingSyncJob): Promise<{
    product: ProductDetail;
    listing: ListingSyncRecord & { externalId: string };
  } | null> {
    const listing = await this.listings.findPrimary(
      job.workspaceId,
      job.connectionId,
      job.productId,
    );
    if (!isOnChannel(listing)) return null;
    const product = await this.products.find(job.workspaceId, job.productId);
    return product ? { product, listing } : null;
  }
}
