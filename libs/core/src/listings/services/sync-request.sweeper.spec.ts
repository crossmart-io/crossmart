import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import {
  SYNC_REQUEST_STALE_AFTER_MS,
  SYNC_REQUEST_SWEEP_BATCH_SIZE,
} from '../listings.constants.js';
import type {
  ListingSyncRepository,
  SyncRequestRef,
} from '../repositories/listing-sync.repository.js';
import { CONNECTION_ID, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { SyncJobQueue } from './sync-job.queue.js';
import { SyncRequestSweeper } from './sync-request.sweeper.js';

const NOW = new Date('2026-11-06T12:00:00Z');
const STALE_BEFORE = new Date(NOW.getTime() - SYNC_REQUEST_STALE_AFTER_MS);

function stale(index: number, productId = `product-${index}`): SyncRequestRef {
  return {
    listingId: `listing-${index}`,
    workspaceId: WORKSPACE_ID,
    connectionId: CONNECTION_ID,
    productId,
  };
}

function setup(batches: SyncRequestRef[][]) {
  const find = vi.fn<ListingSyncRepository['findStaleSyncRequests']>();
  for (const batch of batches) find.mockResolvedValueOnce(batch);
  find.mockResolvedValue([]);
  const listings = {
    findStaleSyncRequests: find,
    renewSyncRequests: vi
      .fn<ListingSyncRepository['renewSyncRequests']>()
      .mockImplementation((ids) => Promise.resolve(ids.length)),
  };
  const queue = { enqueue: vi.fn<SyncJobQueue['enqueue']>().mockResolvedValue() };
  const sweeper = new SyncRequestSweeper(
    listings as unknown as ListingSyncRepository,
    queue as unknown as SyncJobQueue,
  );
  return { sweeper, listings, queue };
}

describe('SyncRequestSweeper', () => {
  it('queues a content job again for each listing whose request outlived the threshold', async () => {
    const { sweeper, listings, queue } = setup([[stale(1), stale(2)]]);

    expect(await sweeper.sweep(NOW)).toBe(2);

    expect(listings.findStaleSyncRequests).toHaveBeenCalledWith(
      STALE_BEFORE,
      SYNC_REQUEST_SWEEP_BATCH_SIZE,
    );
    expect(queue.enqueue).toHaveBeenCalledWith([
      {
        kind: SyncJobKind.Content,
        workspaceId: WORKSPACE_ID,
        connectionId: CONNECTION_ID,
        productId: 'product-1',
      },
      {
        kind: SyncJobKind.Content,
        workspaceId: WORKSPACE_ID,
        connectionId: CONNECTION_ID,
        productId: 'product-2',
      },
    ]);
  });

  it('marks the batch requested again before queuing it, so the next sweep skips it', async () => {
    const { sweeper, listings, queue } = setup([[stale(1)]]);

    await sweeper.sweep(NOW);

    expect(listings.renewSyncRequests).toHaveBeenCalledWith(['listing-1'], STALE_BEFORE, NOW);
    const [renewOrder] = listings.renewSyncRequests.mock.invocationCallOrder;
    const [enqueueOrder] = queue.enqueue.mock.invocationCallOrder;
    expect(renewOrder).toBeLessThan(enqueueOrder ?? 0);
  });

  it('works through full batches until one comes back short', async () => {
    const full = Array.from({ length: SYNC_REQUEST_SWEEP_BATCH_SIZE }, (_, index) => stale(index));
    const { sweeper, listings, queue } = setup([full, [stale(SYNC_REQUEST_SWEEP_BATCH_SIZE)]]);

    expect(await sweeper.sweep(NOW)).toBe(SYNC_REQUEST_SWEEP_BATCH_SIZE + 1);

    expect(listings.findStaleSyncRequests).toHaveBeenCalledTimes(2);
    expect(queue.enqueue).toHaveBeenCalledTimes(2);
  });

  it('queues one job per product and store, and nothing when no request is stale', async () => {
    const twice = setup([[stale(1, 'product-1'), stale(2, 'product-1')]]);
    const none = setup([]);

    await twice.sweeper.sweep(NOW);
    expect(await none.sweeper.sweep(NOW)).toBe(0);

    expect(twice.queue.enqueue.mock.calls[0]?.[0]).toHaveLength(1);
    expect(none.queue.enqueue).not.toHaveBeenCalled();
    expect(none.listings.renewSyncRequests).not.toHaveBeenCalled();
  });

  it('counts only the listings still unsettled when it renews them', async () => {
    const { sweeper, listings } = setup([[stale(1), stale(2)]]);
    listings.renewSyncRequests.mockResolvedValue(1);

    expect(await sweeper.sweep(NOW)).toBe(1);
  });
});
