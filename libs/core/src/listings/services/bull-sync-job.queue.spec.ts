import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { SYNC_DEBOUNCE_MS } from '../listings.constants.js';
import { syncJob } from '../testing/listing.fixtures.js';
import {
  BullSyncJobQueue,
  SYNC_JOB_QUEUES,
  syncJobKey,
  syncJobOptions,
} from './bull-sync-job.queue.js';

function fakeQueue() {
  return { addBulk: vi.fn<Queue['addBulk']>().mockResolvedValue([]) };
}

describe('BullSyncJobQueue', () => {
  it('routes each kind to its priority queue: inventory, then price, then content', async () => {
    const [inventory, price, content] = [fakeQueue(), fakeQueue(), fakeQueue()];
    const queue = new BullSyncJobQueue(
      inventory as unknown as Queue,
      price as unknown as Queue,
      content as unknown as Queue,
    );

    await queue.enqueue([
      syncJob(SyncJobKind.Inventory),
      syncJob(SyncJobKind.Content),
      syncJob(SyncJobKind.Delist),
      syncJob(SyncJobKind.Price),
    ]);

    expect(inventory.addBulk.mock.calls[0]?.[0].map((job) => job.name)).toEqual([
      SyncJobKind.Inventory,
    ]);
    expect(price.addBulk.mock.calls[0]?.[0].map((job) => job.name)).toEqual([SyncJobKind.Price]);
    expect(content.addBulk.mock.calls[0]?.[0].map((job) => job.name)).toEqual([
      SyncJobKind.Content,
      SyncJobKind.Delist,
    ]);
    expect(SYNC_JOB_QUEUES[SyncJobKind.Delist]).toBe(QueueName.Content);
  });

  it('debounces per listing and kind, replacing the waiting job with the newest', () => {
    const job = syncJob(SyncJobKind.Content);

    expect(syncJobKey(job)).toBe(`content:${job.connectionId}:${job.productId}`);
    expect(syncJobOptions(job)).toMatchObject({
      delay: SYNC_DEBOUNCE_MS[SyncJobKind.Content],
      deduplication: { id: syncJobKey(job), extend: true, replace: true },
      attempts: 5,
      backoff: { type: 'exponential' },
    });
    expect(SYNC_DEBOUNCE_MS[SyncJobKind.Inventory]).toBeLessThan(
      SYNC_DEBOUNCE_MS[SyncJobKind.Content],
    );
  });
});
