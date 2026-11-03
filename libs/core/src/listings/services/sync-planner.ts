import { Injectable } from '@nestjs/common';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ProductSelectionService } from './product-selection.service.js';
import type { SyncConnection } from './sync-connection.loader.js';

/** The jobs that bring a connection in line with its selection. */
export interface SyncPlan {
  publish: ListingSyncJob[];
  delist: ListingSyncJob[];
}

/**
 * Plans a full sync of a connection: every selected product is published or updated, and
 * every listing the channel holds for a product no longer selected is delisted. Selected
 * products get a pending listing right away, so the listings table shows them queued.
 */
@Injectable()
export class SyncPlanner {
  constructor(
    private readonly selection: ProductSelectionService,
    private readonly listings: ListingSyncRepository,
  ) {}

  async plan(workspaceId: string, connection: SyncConnection): Promise<SyncPlan> {
    const connectionId = connection.view.id;
    const job = (kind: ListingSyncJob['kind'], productId: string): ListingSyncJob => ({
      kind,
      workspaceId,
      connectionId,
      productId,
    });
    const selected = new Set<string>();
    for await (const batch of this.selection.selectedIds({
      workspaceId,
      connectionId,
      rule: connection.view.settings.productSelection,
    })) {
      await this.listings.createPending(workspaceId, connectionId, batch);
      batch.forEach((productId) => selected.add(productId));
    }
    const onChannel = await this.listings.listProductIdsOnChannel(workspaceId, connectionId);
    return {
      publish: [...selected].map((productId) => job(SyncJobKind.Content, productId)),
      delist: onChannel
        .filter((productId) => !selected.has(productId))
        .map((productId) => job(SyncJobKind.Delist, productId)),
    };
  }
}
