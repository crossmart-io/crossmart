import { Injectable } from '@nestjs/common';
import { ChannelConnectionStatus, type Prisma } from '@crossmart/database';
import type { ListingSyncJob, SyncRequestResult } from '../entities/listing-sync-job.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import { channelProductStateWhere } from '../rules/channel-product-state-where.js';
import type { SelectionScope } from '../rules/selection-where.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';
import { SyncJobQueue } from './sync-job.queue.js';

const NOTHING_APPLIED: SyncRequestResult = { queued: 0, delisting: 0 };

/** What a rule change does to a store: products it now adds, and products it now drops. */
export interface SelectionImpact {
  toPublish: number;
  toRemove: number;
}

/**
 * Applies a store's rules at once, by their difference only: products the selection now adds
 * are published, products it drops are delisted, and a new pricing rule re-sends prices.
 */
@Injectable()
export class SelectionApplier {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly products: ProductSelectionRepository,
    private readonly listings: ListingSyncRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  /** What saving `scope.rule` would publish and remove, for the editor to show before saving. */
  async impact(scope: SelectionScope): Promise<SelectionImpact> {
    const [toPublish, toRemove] = await Promise.all([
      this.products.count(channelProductStateWhere(scope, ChannelProductState.Pending)),
      this.products.count(channelProductStateWhere(scope, ChannelProductState.Removing)),
    ]);
    return { toPublish, toRemove };
  }

  /** Publishes what the saved selection adds and delists what it drops. */
  async applySelection(workspaceId: string, connectionId: string): Promise<SyncRequestResult> {
    const scope = await this.connectedScope(workspaceId, connectionId);
    if (!scope) return NOTHING_APPLIED;
    let queued = 0;
    for await (const batch of this.ids(
      channelProductStateWhere(scope, ChannelProductState.Pending),
    )) {
      await this.listings.createPending(workspaceId, connectionId, batch);
      await this.queue.enqueue(
        this.jobs(scope, batch, [SyncJobKind.Content, SyncJobKind.Inventory]),
      );
      queued += batch.length;
    }
    let delisting = 0;
    for await (const batch of this.ids(
      channelProductStateWhere(scope, ChannelProductState.Removing),
    )) {
      await this.queue.enqueue(this.jobs(scope, batch, [SyncJobKind.Delist]));
      delisting += batch.length;
    }
    return { queued, delisting };
  }

  /** Re-sends the prices of every product on the channel, after a pricing rule change. */
  async applyPricing(workspaceId: string, connectionId: string): Promise<number> {
    const scope = await this.connectedScope(workspaceId, connectionId);
    if (!scope) return 0;
    let queued = 0;
    for await (const batch of this.ids(
      channelProductStateWhere(scope, ChannelProductState.Listed),
    )) {
      await this.queue.enqueue(this.jobs(scope, batch, [SyncJobKind.Price]));
      queued += batch.length;
    }
    return queued;
  }

  /** The store's selection, or null when it is not connected: nothing can be sent then. */
  private async connectedScope(
    workspaceId: string,
    connectionId: string,
  ): Promise<SelectionScope | null> {
    const connection = await this.connections.require(workspaceId, connectionId);
    if (connection.view.status !== ChannelConnectionStatus.CONNECTED) return null;
    return { workspaceId, connectionId, rule: connection.view.settings.productSelection };
  }

  private async *ids(where: Prisma.ProductWhereInput): AsyncGenerator<string[]> {
    let afterId: string | undefined;
    for (;;) {
      const batch = await this.products.listIds(where, SELECTION_BATCH_SIZE, afterId);
      if (batch.length > 0) yield batch;
      if (batch.length < SELECTION_BATCH_SIZE) return;
      afterId = batch.at(-1);
    }
  }

  private jobs(
    scope: SelectionScope,
    productIds: string[],
    kinds: ListingSyncJob['kind'][],
  ): ListingSyncJob[] {
    const { workspaceId, connectionId } = scope;
    return productIds.flatMap((productId) =>
      kinds.map((kind) => ({ kind, workspaceId, connectionId, productId })),
    );
  }
}
