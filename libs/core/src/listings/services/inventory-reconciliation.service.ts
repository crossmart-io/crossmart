import { Injectable, Logger } from '@nestjs/common';
import { chunk } from '@crossmart/common';
import { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncJobQueue } from './sync-job.queue.js';

/**
 * Inventory reconciliation (ADR 0007, every 15 minutes): checks the stock of every listing of
 * every connected account, which corrects drift whatever caused it. Each job reads what the
 * channel shows and sends only the items that differ, where the connector can read stock.
 */
@Injectable()
export class InventoryReconciliationService {
  private readonly logger = new Logger(InventoryReconciliationService.name);

  constructor(
    private readonly connections: ChannelConnectionRepository,
    private readonly listings: ListingSyncRepository,
    private readonly queue: SyncJobQueue,
  ) {}

  /** Returns how many inventory jobs were queued. */
  async reconcile(): Promise<number> {
    let queued = 0;
    for (const connection of await this.connections.listConnected()) {
      const { workspaceId, id: connectionId } = connection;
      const productIds = await this.listings.listProductIdsOnChannel(workspaceId, connectionId);
      const jobs: ListingSyncJob[] = productIds.map((productId) => ({
        kind: SyncJobKind.Inventory,
        workspaceId,
        connectionId,
        productId,
        reconcile: true,
      }));
      for (const batch of chunk(jobs, SELECTION_BATCH_SIZE)) {
        await this.queue.enqueue(batch);
      }
      queued += jobs.length;
    }
    this.logger.log(`Inventory reconciliation queued ${queued} listings`);
    return queued;
  }
}
