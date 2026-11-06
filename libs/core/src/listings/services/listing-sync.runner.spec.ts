import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  CONNECTION_ID,
  LISTING_ID,
  listingRecord,
  PRODUCT_ID,
  syncJob,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import type { ListingContentSync } from './listing-content.sync.js';
import type { ListingInventorySync } from './listing-inventory.sync.js';
import type { ListingPriceSync } from './listing-price.sync.js';
import type { ListingSyncFailures } from './listing-sync-failures.js';
import { type ListingSyncExecutors, ListingSyncRunner } from './listing-sync.runner.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';

const SCOPE = { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID };

function setup() {
  const content = {
    publish: vi.fn<ListingContentSync['publish']>().mockResolvedValue(),
    delist: vi.fn<ListingContentSync['delist']>().mockResolvedValue(),
  };
  const price = { run: vi.fn<ListingPriceSync['run']>().mockResolvedValue() };
  const inventory = { run: vi.fn<ListingInventorySync['run']>().mockResolvedValue() };
  const listings = {
    clearSyncRequest: vi.fn<ListingSyncRepository['clearSyncRequest']>().mockResolvedValue(),
    findPrimary: vi.fn<ListingSyncRepository['findPrimary']>().mockResolvedValue(listingRecord()),
  };
  const failures = { exhausted: vi.fn<ListingSyncFailures['exhausted']>().mockResolvedValue() };
  const runner = new ListingSyncRunner(
    { content, price, inventory } as unknown as ListingSyncExecutors,
    {} as SyncConnectionLoader,
    listings as unknown as ListingSyncRepository,
    failures as unknown as ListingSyncFailures,
  );
  return { runner, content, inventory, listings, failures };
}

describe('ListingSyncRunner', () => {
  it.each([SyncJobKind.Content, SyncJobKind.Delist] as const)(
    'settles the listing’s sync request once a %s job finished',
    async (kind) => {
      const { runner, listings } = setup();

      await runner.run(syncJob(kind));

      expect(listings.clearSyncRequest).toHaveBeenCalledWith(SCOPE, PRODUCT_ID);
    },
  );

  it('leaves the request for a retry when the job throws', async () => {
    const { runner, content, listings } = setup();
    content.publish.mockRejectedValue(new Error('rate limited'));

    await expect(runner.run(syncJob())).rejects.toThrow('rate limited');
    expect(listings.clearSyncRequest).not.toHaveBeenCalled();
  });

  it('does not settle on a stock or price job, which a sync does not wait for', async () => {
    const { runner, inventory, listings } = setup();

    await runner.run(syncJob(SyncJobKind.Inventory));

    expect(inventory.run).toHaveBeenCalledOnce();
    expect(listings.clearSyncRequest).not.toHaveBeenCalled();
  });

  it('marks the listing in error and settles it when the queue gives up', async () => {
    const { runner, listings, failures } = setup();
    const error = new Error('down');

    await runner.exhausted(syncJob(), error);

    expect(failures.exhausted).toHaveBeenCalledWith(
      { workspaceId: WORKSPACE_ID, listingId: LISTING_ID },
      error,
    );
    expect(listings.clearSyncRequest).toHaveBeenCalledWith(SCOPE, PRODUCT_ID);
  });
});
