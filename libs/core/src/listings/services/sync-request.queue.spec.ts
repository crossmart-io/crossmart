import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { CONNECTION_ID, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { SyncJobQueue } from './sync-job.queue.js';
import { SyncRequestQueue } from './sync-request.queue.js';

const SCOPE = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID };

function job(productId: string, kind: SyncJobKind.Content | SyncJobKind.Inventory) {
  return { kind, ...SCOPE, productId };
}

function setup() {
  const listings = {
    markSyncRequested: vi.fn<ListingSyncRepository['markSyncRequested']>().mockResolvedValue(),
  };
  const queue = { enqueue: vi.fn<SyncJobQueue['enqueue']>().mockResolvedValue() };
  const requests = new SyncRequestQueue(
    listings as unknown as ListingSyncRepository,
    queue as unknown as SyncJobQueue,
  );
  return { requests, listings, queue };
}

describe('SyncRequestQueue', () => {
  it('marks each product’s listings once, before its jobs are queued', async () => {
    const { requests, listings, queue } = setup();
    const jobs = [job('p-1', SyncJobKind.Content), job('p-1', SyncJobKind.Inventory)];

    await requests.enqueue(SCOPE, jobs);

    expect(listings.markSyncRequested).toHaveBeenCalledWith(SCOPE, ['p-1'], expect.any(Date));
    expect(queue.enqueue).toHaveBeenCalledWith(jobs);
    expect(listings.markSyncRequested.mock.invocationCallOrder[0]).toBeLessThan(
      queue.enqueue.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('marks and queues a large sync in batches, all with one request time', async () => {
    const { requests, listings, queue } = setup();
    const jobs = Array.from({ length: SELECTION_BATCH_SIZE + 1 }, (_, index) =>
      job(`p-${index}`, SyncJobKind.Content),
    );

    await requests.enqueue(SCOPE, jobs);

    expect(queue.enqueue).toHaveBeenCalledTimes(2);
    const [first, second] = listings.markSyncRequested.mock.calls;
    expect(first?.[1]).toHaveLength(SELECTION_BATCH_SIZE);
    expect(second?.[1]).toEqual([`p-${SELECTION_BATCH_SIZE}`]);
    expect(first?.[2]).toBe(second?.[2]);
  });
});
