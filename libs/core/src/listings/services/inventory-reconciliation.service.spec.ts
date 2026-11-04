import type { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import { connectionRecord } from '../../channels/testing/channel-connection.fixtures.js';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { InventoryReconciliationService } from './inventory-reconciliation.service.js';
import { SyncJobQueue } from './sync-job.queue.js';

class CapturingQueue extends SyncJobQueue {
  readonly jobs: ListingSyncJob[] = [];
  enqueue(jobs: readonly ListingSyncJob[]): Promise<void> {
    this.jobs.push(...jobs);
    return Promise.resolve();
  }
}

describe('InventoryReconciliationService', () => {
  it('re-sends the stock of every listing of every connected account', async () => {
    const connections = {
      listConnected: vi
        .fn<ChannelConnectionRepository['listConnected']>()
        .mockResolvedValue([connectionRecord({ id: 'c1' }), connectionRecord({ id: 'c2' })]),
    };
    const listings = {
      listProductIdsOnChannel: vi
        .fn<ListingSyncRepository['listProductIdsOnChannel']>()
        .mockResolvedValueOnce(['p1', 'p2'])
        .mockResolvedValueOnce(['p3']),
    };
    const queue = new CapturingQueue();
    const service = new InventoryReconciliationService(
      connections as unknown as ChannelConnectionRepository,
      listings as unknown as ListingSyncRepository,
      queue,
    );

    await expect(service.reconcile()).resolves.toBe(3);

    expect(queue.jobs.map((job) => [job.kind, job.connectionId, job.productId])).toEqual([
      [SyncJobKind.Inventory, 'c1', 'p1'],
      [SyncJobKind.Inventory, 'c1', 'p2'],
      [SyncJobKind.Inventory, 'c2', 'p3'],
    ]);
    expect(queue.jobs.every((job) => job.reconcile)).toBe(true);
  });
});
