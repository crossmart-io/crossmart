import { ChannelCapability, type InventorySync } from '@crossmart/connectors';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import type { ListingStockRecord } from '../repositories/listing-sync.queries.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  type ConnectorDouble,
  LISTING_ID,
  syncConnection,
  syncJob,
} from '../testing/listing.fixtures.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingInventorySync } from './listing-inventory.sync.js';
import { ListingSyncFailures } from './listing-sync-failures.js';
import { ListingSyncOutcomes } from './listing-sync-outcomes.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';

function stockRecord(
  count: number,
  override: ListingStockRecord['override'] = null,
): ListingStockRecord {
  return {
    id: LISTING_ID,
    override,
    variants: Array.from({ length: count }, (_, index) => ({
      externalInventoryId: `item-${index}`,
      variant: { inventoryItem: { tracked: index !== 1, available: 10 } },
    })),
  } as ListingStockRecord;
}

/** `held` is the listing the channel holds; empty when it holds none. */
function setup(held: ListingStockRecord[], maxBatchSize = 2) {
  const setQuantities = vi.fn<InventorySync['setQuantities']>().mockResolvedValue([]);
  const connector = {
    maxBatchSize,
    setQuantities,
    capabilities: new Set([ChannelCapability.UpdateInventory]),
  } as unknown as ConnectorDouble;
  const connections = {
    load: vi.fn<SyncConnectionLoader['load']>().mockResolvedValue(syncConnection(connector)),
    openSession: vi.fn<SyncConnectionLoader['openSession']>().mockResolvedValue({
      connectionId: 'c',
      externalAccountId: 'a',
      grantedScopes: [],
      accessToken: () => Promise.resolve('t'),
    }),
  };
  const listings = {
    findPrimaryStock: vi
      .fn<ListingSyncRepository['findPrimaryStock']>()
      .mockResolvedValue(held[0] ?? null),
    recordSynced: vi.fn<ListingSyncRepository['recordSynced']>().mockResolvedValue(),
    recordFailure: vi.fn<ListingSyncRepository['recordFailure']>().mockResolvedValue(),
  };
  const repository = listings as unknown as ListingSyncRepository;
  const activity = new InMemoryActivityRecorder();
  const sync = new ListingInventorySync(
    connections as unknown as SyncConnectionLoader,
    repository,
    new ListingSyncOutcomes(
      repository,
      {} as ChannelConnectionRepository,
      activity,
      new ListingSyncFailures(repository, activity),
    ),
  );
  return { sync, setQuantities, listings };
}

describe('ListingInventorySync', () => {
  it('sends tracked variants in batches of the connector’s size, minus the buffer, capped', async () => {
    const { sync, setQuantities, listings } = setup([
      stockRecord(5, { inventoryBuffer: 3, maxQuantity: 6 }),
    ]);

    await sync.run(syncJob(SyncJobKind.Inventory));

    expect(
      setQuantities.mock.calls.map(([, batch]) =>
        batch.map((update) => update.externalInventoryId),
      ),
    ).toEqual([
      ['item-0', 'item-2'],
      ['item-3', 'item-4'],
    ]);
    expect(setQuantities.mock.calls[0]?.[1][0]?.available).toBe(6);
    expect(listings.recordSynced).toHaveBeenCalledWith(LISTING_ID, expect.any(Date));
  });

  it('records the first rejected item on the listing and keeps the rest', async () => {
    const { sync, setQuantities, listings } = setup([stockRecord(3)]);
    setQuantities.mockResolvedValueOnce([
      { externalInventoryId: 'item-0', message: 'Not stocked here' },
    ]);

    await sync.run(syncJob(SyncJobKind.Inventory));

    expect(listings.recordFailure).toHaveBeenCalledWith(LISTING_ID, 'Not stocked here');
    expect(listings.recordSynced).not.toHaveBeenCalled();
  });

  it('does nothing for listings the channel does not hold', async () => {
    const { sync, setQuantities } = setup([]);

    await sync.run(syncJob(SyncJobKind.Inventory));

    expect(setQuantities).not.toHaveBeenCalled();
  });
});
