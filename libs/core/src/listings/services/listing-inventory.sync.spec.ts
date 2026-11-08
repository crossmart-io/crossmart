import { ChannelCapability, type InventorySync } from '@crossmart/connectors';
import { InMemoryActivityRecorder } from '../../activity/testing/in-memory-activity-recorder.js';
import type { ChannelConnectionRepository } from '../../channels/repositories/channel-connection.repository.js';
import type { ListingStockRecord } from '../repositories/listing-sync.queries.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ActivityOutcome } from '@crossmart/database';
import { ActivityAction } from '../../activity/enums/activity-action.enum.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  LISTING_ID,
  syncConnection,
  syncJob,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import { ListingInventorySync } from './listing-inventory.sync.js';
import { ListingSyncFailures } from './listing-sync-failures.js';
import { ListingSyncOutcomes } from './listing-sync-outcomes.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';

/** The listing the repository is asked to write to, always with its workspace. */
const LISTING_REF = expect.objectContaining({ workspaceId: WORKSPACE_ID, listingId: LISTING_ID });

function stockRecord(
  count: number,
  override: ListingStockRecord['override'] = null,
  lastError: string | null = null,
): ListingStockRecord {
  return {
    id: LISTING_ID,
    lastError,
    product: { title: 'Mug' },
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
  return {
    sync,
    setQuantities,
    listings,
    activity,
    connector: connector as unknown as InventorySync,
  };
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
    expect(listings.recordSynced).toHaveBeenCalledWith(LISTING_REF, expect.any(Date));
  });

  it('records the first rejected item on the listing and keeps the rest', async () => {
    const { sync, setQuantities, listings } = setup([stockRecord(3)]);
    setQuantities.mockResolvedValueOnce([
      { externalInventoryId: 'item-0', message: 'Not stocked here' },
    ]);

    await sync.run(syncJob(SyncJobKind.Inventory));

    expect(listings.recordFailure).toHaveBeenCalledWith(LISTING_REF, 'Not stocked here');
    expect(listings.recordSynced).not.toHaveBeenCalled();
  });

  it('logs a refused stock level once, not again while the listing shows the same reason', async () => {
    const first = setup([stockRecord(3)]);
    const again = setup([stockRecord(3, null, 'Not stocked here')]);
    for (const { setQuantities } of [first, again]) {
      setQuantities.mockResolvedValueOnce([
        { externalInventoryId: 'item-0', message: 'Not stocked here' },
      ]);
    }

    await first.sync.run(syncJob(SyncJobKind.Inventory));
    await again.sync.run(syncJob(SyncJobKind.Inventory));

    expect(first.activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.StockSyncFailed,
        outcome: ActivityOutcome.FAILED,
        failureReason: 'Not stocked here',
        connectionId: CONNECTION_ID,
        subject: expect.objectContaining({ label: 'Mug' }),
      }),
    ]);
    expect(again.activity.entries).toEqual([]);
  });

  it('does nothing for listings the channel does not hold', async () => {
    const { sync, setQuantities } = setup([]);

    await sync.run(syncJob(SyncJobKind.Inventory));

    expect(setQuantities).not.toHaveBeenCalled();
  });

  it('sends only what the channel shows wrongly when reconciling', async () => {
    const { sync, setQuantities, connector } = setup([stockRecord(3)]);
    connector.readQuantities = vi
      .fn<NonNullable<InventorySync['readQuantities']>>()
      .mockResolvedValue(
        new Map([
          ['item-0', 10],
          ['item-2', 4],
        ]),
      );

    await sync.run({ ...syncJob(SyncJobKind.Inventory), reconcile: true });
    await sync.run(syncJob(SyncJobKind.Inventory));

    expect(setQuantities.mock.calls.map(([, batch]) => batch)).toEqual([
      [{ externalInventoryId: 'item-2', available: 10 }],
      [
        { externalInventoryId: 'item-0', available: 10 },
        { externalInventoryId: 'item-2', available: 10 },
      ],
    ]);
    expect(connector.readQuantities).toHaveBeenCalledTimes(1);
  });

  it('logs what reconciliation corrected, and nothing when the store was right', async () => {
    const { sync, connector, activity, listings } = setup([stockRecord(3)]);
    connector.readQuantities = vi
      .fn<NonNullable<InventorySync['readQuantities']>>()
      .mockResolvedValueOnce(
        new Map([
          ['item-0', 10],
          ['item-2', 4],
        ]),
      )
      .mockResolvedValueOnce(
        new Map([
          ['item-0', 10],
          ['item-2', 10],
        ]),
      );

    await sync.run({ ...syncJob(SyncJobKind.Inventory), reconcile: true });
    await sync.run({ ...syncJob(SyncJobKind.Inventory), reconcile: true });

    expect(activity.entries).toEqual([
      expect.objectContaining({
        action: ActivityAction.StockReconciled,
        itemCount: 1,
        detail: expect.any(String),
        connectionId: CONNECTION_ID,
      }),
    ]);
    expect(listings.recordSynced).toHaveBeenCalledTimes(2);
  });
});
