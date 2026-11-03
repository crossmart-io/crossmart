import { DelayedError, type Job } from 'bullmq';
import { RateLimitScope } from '@crossmart/connectors';
import type {
  InventoryReconciliationService,
  ListingSyncJob,
  ListingSyncRunner,
} from '@crossmart/core';
import { SyncJobKind } from '@crossmart/core';
import { ConnectionRateLimiter } from './connection-rate-limiter.js';
import { ListingJobHandler, type SyncQueueJob } from './listing-job.handler.js';

const DATA: ListingSyncJob = {
  kind: SyncJobKind.Content,
  workspaceId: 'w',
  connectionId: 'c',
  productId: 'p',
};

function job(
  overrides: Partial<SyncQueueJob> = {},
  moveToDelayed = vi.fn<Job['moveToDelayed']>().mockResolvedValue(),
): SyncQueueJob {
  return {
    name: SyncJobKind.Content,
    data: DATA,
    opts: { attempts: 5 },
    attemptsMade: 1,
    moveToDelayed,
    ...overrides,
  } as unknown as SyncQueueJob;
}

function setup(capacity = 100) {
  const runner = {
    run: vi.fn<ListingSyncRunner['run']>().mockResolvedValue(),
    rateLimitsOf: vi
      .fn<ListingSyncRunner['rateLimitsOf']>()
      .mockResolvedValue([
        { name: 'graphql', scope: RateLimitScope.Connection, capacity, restorePerSecond: 50 },
      ]),
    exhausted: vi.fn<ListingSyncRunner['exhausted']>().mockResolvedValue(),
  };
  const reconciliation = {
    reconcile: vi.fn<InventoryReconciliationService['reconcile']>().mockResolvedValue(0),
  };
  const handler = new ListingJobHandler(
    runner as unknown as ListingSyncRunner,
    reconciliation as unknown as InventoryReconciliationService,
    new ConnectionRateLimiter(),
  );
  return { handler, runner, reconciliation };
}

describe('ListingJobHandler', () => {
  it('runs a job when its connection’s bucket has room', async () => {
    const { handler, runner } = setup();

    await handler.handle(job(), 'token');

    expect(runner.run).toHaveBeenCalledWith(DATA);
  });

  it('moves a job back to the delayed set when its connection is out of budget', async () => {
    const { handler, runner } = setup(40);
    const moveToDelayed = vi.fn<Job['moveToDelayed']>().mockResolvedValue();

    await handler.handle(job(), 'token');
    await expect(handler.handle(job({}, moveToDelayed), 'token')).rejects.toBeInstanceOf(
      DelayedError,
    );

    expect(moveToDelayed).toHaveBeenCalledWith(expect.any(Number), 'token');
    expect(runner.run).toHaveBeenCalledTimes(1);
  });

  it('runs the reconciliation tick', async () => {
    const { handler, reconciliation, runner } = setup();

    await handler.handle(
      job({ name: SyncJobKind.ReconcileInventory, data: {} } as Partial<SyncQueueJob>),
    );

    expect(reconciliation.reconcile).toHaveBeenCalled();
    expect(runner.run).not.toHaveBeenCalled();
  });

  it('marks the listing in error only once retries are spent', async () => {
    const { handler, runner } = setup();
    const error = new Error('down');

    await handler.failed(job({ attemptsMade: 2 }), error);
    await handler.failed(job({ attemptsMade: 5 }), error);

    expect(runner.exhausted).toHaveBeenCalledTimes(1);
    expect(runner.exhausted).toHaveBeenCalledWith(DATA, error);
  });
});
