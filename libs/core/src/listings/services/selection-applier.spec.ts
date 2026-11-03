import { ChannelConnectionStatus } from '@crossmart/database';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import type { ProductSelectionRepository } from '../repositories/product-selection.repository.js';
import {
  CONNECTION_ID,
  type ConnectorDouble,
  connectionView,
  syncConnection,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { SelectionApplier } from './selection-applier.js';
import type { SyncConnectionLoader } from './sync-connection.loader.js';
import type { SyncJobQueue } from './sync-job.queue.js';

function setup(status: ChannelConnectionStatus = ChannelConnectionStatus.CONNECTED) {
  const connection = { ...syncConnection({} as ConnectorDouble), view: connectionView({ status }) };
  const connections = {
    require: vi.fn<SyncConnectionLoader['require']>().mockResolvedValue(connection),
  };
  const products = {
    count: vi.fn<ProductSelectionRepository['count']>().mockResolvedValue(0),
    listIds: vi.fn<ProductSelectionRepository['listIds']>().mockResolvedValue([]),
  };
  const listings = {
    createPending: vi.fn<ListingSyncRepository['createPending']>().mockResolvedValue(),
  };
  const queue = { enqueue: vi.fn<SyncJobQueue['enqueue']>().mockResolvedValue() };
  const applier = new SelectionApplier(
    connections as unknown as SyncConnectionLoader,
    products as unknown as ProductSelectionRepository,
    listings as unknown as ListingSyncRepository,
    queue as unknown as SyncJobQueue,
  );
  return { applier, products, listings, queue };
}

const kinds = (queue: ReturnType<typeof setup>['queue']) =>
  queue.enqueue.mock.calls.flatMap(([jobs]) => jobs.map((job) => [job.productId, job.kind]));

describe('SelectionApplier', () => {
  it('says what a rule would publish and remove', async () => {
    const { applier, products } = setup();
    products.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1);

    const impact = await applier.impact({
      workspaceId: WORKSPACE_ID,
      connectionId: CONNECTION_ID,
      rule: null,
    });

    expect(impact).toEqual({ toPublish: 4, toRemove: 1 });
  });

  it('publishes what the selection adds and delists what it drops, only those', async () => {
    const { applier, products, listings, queue } = setup();
    products.listIds.mockResolvedValueOnce(['p-new']).mockResolvedValueOnce(['p-gone']);

    const result = await applier.applySelection(WORKSPACE_ID, CONNECTION_ID);

    expect(result).toEqual({ queued: 1, delisting: 1 });
    expect(listings.createPending).toHaveBeenCalledWith(WORKSPACE_ID, CONNECTION_ID, ['p-new']);
    expect(kinds(queue)).toEqual([
      ['p-new', SyncJobKind.Content],
      ['p-new', SyncJobKind.Inventory],
      ['p-gone', SyncJobKind.Delist],
    ]);
  });

  it('re-sends the prices of listed products after a pricing change', async () => {
    const { applier, products, queue } = setup();
    products.listIds.mockResolvedValueOnce(['p-1', 'p-2']);

    expect(await applier.applyPricing(WORKSPACE_ID, CONNECTION_ID)).toBe(2);
    expect(kinds(queue)).toEqual([
      ['p-1', SyncJobKind.Price],
      ['p-2', SyncJobKind.Price],
    ]);
  });

  it('sends nothing to a store that is not connected', async () => {
    const { applier, queue } = setup(ChannelConnectionStatus.NEEDS_REAUTH);

    expect(await applier.applySelection(WORKSPACE_ID, CONNECTION_ID)).toEqual({
      queued: 0,
      delisting: 0,
    });
    expect(queue.enqueue).not.toHaveBeenCalled();
  });
});
