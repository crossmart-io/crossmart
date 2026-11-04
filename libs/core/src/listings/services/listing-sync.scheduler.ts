import { Injectable, type OnModuleInit } from '@nestjs/common';
import type {
  CatalogChangeListener,
  ProductsChangedEvent,
  ProductsDeletingEvent,
  StockChangedEvent,
} from '../../events/entities/catalog-events.js';
import { CatalogChangeKind } from '../../events/enums/catalog-change-kind.enum.js';
import { CatalogEventBus } from '../../events/services/catalog-event-bus.js';
import type { ListingJobKind, ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingPair } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncJobQueue } from './sync-job.queue.js';

/** The jobs a change needs. A content sync sends prices too, so it makes a price job redundant. */
function jobKindsFor(kinds: readonly CatalogChangeKind[]): ListingJobKind[] {
  const jobs: ListingJobKind[] = [];
  if (kinds.includes(CatalogChangeKind.Stock)) jobs.push(SyncJobKind.Inventory);
  if (kinds.includes(CatalogChangeKind.Content)) jobs.push(SyncJobKind.Content);
  else if (kinds.includes(CatalogChangeKind.Price)) jobs.push(SyncJobKind.Price);
  return jobs;
}

/**
 * Turns catalog and stock changes into sync jobs, for the listings the channels already hold
 * (new products are published from the connection's "Publish" action). A stock change fans
 * out only to the listings of the variants it touched. A deleted product is delisted.
 */
@Injectable()
export class ListingSyncScheduler implements CatalogChangeListener, OnModuleInit {
  constructor(
    private readonly events: CatalogEventBus,
    private readonly listings: ListingSyncRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  onModuleInit(): void {
    this.events.subscribe(this);
  }

  async onProductsChanged(event: ProductsChangedEvent): Promise<void> {
    const kinds = jobKindsFor(event.kinds);
    const pairs = await this.listings.findPairsForProducts(event.workspaceId, event.productIds);
    await this.enqueue(event.workspaceId, pairs, kinds);
  }

  async onStockChanged(event: StockChangedEvent): Promise<void> {
    const pairs = await this.listings.findPairsForInventoryItems(
      event.workspaceId,
      event.inventoryItemIds,
    );
    await this.enqueue(event.workspaceId, pairs, [SyncJobKind.Inventory]);
  }

  /** Takes a deleted product off the channels that hold it, with ids kept from its listings. */
  async onProductsDeleting(event: ProductsDeletingEvent): Promise<void> {
    const held = await this.listings.findHeldForProducts(event.workspaceId, event.productIds);
    if (held.length === 0) return;
    await this.queue.enqueue(
      held.map(({ connectionId, productId, externalId, productTitle, variantExternalIds }) => ({
        kind: SyncJobKind.Delist,
        workspaceId: event.workspaceId,
        connectionId,
        productId,
        deleted: { externalId, productTitle, variantExternalIds },
      })),
    );
  }

  private async enqueue(
    workspaceId: string,
    pairs: readonly ListingPair[],
    kinds: readonly ListingJobKind[],
  ): Promise<void> {
    const jobs: ListingSyncJob[] = pairs.flatMap((pair) =>
      kinds.map((kind) => ({ ...pair, workspaceId, kind })),
    );
    if (jobs.length > 0) {
      await this.queue.enqueue(jobs);
    }
  }
}
