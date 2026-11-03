import { CatalogChangeKind } from '../../events/enums/catalog-change-kind.enum.js';
import { CatalogEventBus } from '../../events/services/catalog-event-bus.js';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { ListingSyncScheduler } from './listing-sync.scheduler.js';
import { SyncJobQueue } from './sync-job.queue.js';

const WS = 'ws-1';

class CapturingQueue extends SyncJobQueue {
  readonly jobs: ListingSyncJob[] = [];
  enqueue(jobs: readonly ListingSyncJob[]): Promise<void> {
    this.jobs.push(...jobs);
    return Promise.resolve();
  }
}

function setup() {
  const listings = {
    findPairsForProducts: vi.fn<ListingSyncRepository['findPairsForProducts']>().mockResolvedValue([
      { connectionId: 'c1', productId: 'p1' },
      { connectionId: 'c2', productId: 'p1' },
    ]),
    findPairsForInventoryItems: vi
      .fn<ListingSyncRepository['findPairsForInventoryItems']>()
      .mockResolvedValue([{ connectionId: 'c1', productId: 'p2' }]),
    findHeldForProducts: vi
      .fn<ListingSyncRepository['findHeldForProducts']>()
      .mockResolvedValue([
        { connectionId: 'c1', productId: 'p1', externalId: 'gid://1', productTitle: 'Mug' },
      ]),
  };
  const bus = new CatalogEventBus();
  const queue = new CapturingQueue();
  const scheduler = new ListingSyncScheduler(
    bus,
    listings as unknown as ListingSyncRepository,
    queue,
  );
  scheduler.onModuleInit();
  return { bus, queue, listings };
}

describe('ListingSyncScheduler', () => {
  it('queues a content sync on every connection that lists an edited product', async () => {
    const { bus, queue } = setup();

    await bus.productsChanged({
      workspaceId: WS,
      productIds: ['p1'],
      kinds: [CatalogChangeKind.Content],
    });

    expect(queue.jobs).toEqual([
      { kind: SyncJobKind.Content, workspaceId: WS, connectionId: 'c1', productId: 'p1' },
      { kind: SyncJobKind.Content, workspaceId: WS, connectionId: 'c2', productId: 'p1' },
    ]);
  });

  it('sends prices alone after a price change, and skips them when content goes too', async () => {
    const { bus, queue } = setup();

    await bus.productsChanged({
      workspaceId: WS,
      productIds: ['p1'],
      kinds: [CatalogChangeKind.Price],
    });
    await bus.productsChanged({
      workspaceId: WS,
      productIds: ['p1'],
      kinds: [CatalogChangeKind.Content, CatalogChangeKind.Price, CatalogChangeKind.Stock],
    });

    expect(queue.jobs.map((job) => job.kind)).toEqual([
      SyncJobKind.Price,
      SyncJobKind.Price,
      SyncJobKind.Inventory,
      SyncJobKind.Content,
      SyncJobKind.Inventory,
      SyncJobKind.Content,
    ]);
  });

  it('fans a stock change out only to the listings of the touched items', async () => {
    const { bus, queue, listings } = setup();

    await bus.stockChanged({ workspaceId: WS, inventoryItemIds: ['item-1'] });

    expect(listings.findPairsForInventoryItems).toHaveBeenCalledWith(WS, ['item-1']);
    expect(queue.jobs).toEqual([
      { kind: SyncJobKind.Inventory, workspaceId: WS, connectionId: 'c1', productId: 'p2' },
    ]);
  });

  it('queues nothing for products no channel lists', async () => {
    const { bus, queue, listings } = setup();
    listings.findPairsForProducts.mockResolvedValue([]);

    await bus.productsChanged({
      workspaceId: WS,
      productIds: ['p9'],
      kinds: [CatalogChangeKind.Content],
    });

    expect(queue.jobs).toEqual([]);
  });

  it('delists a product about to be deleted, keeping the id the channel gave it', async () => {
    const { bus, queue, listings } = setup();

    await bus.productsDeleting({ workspaceId: WS, productIds: ['p1'] });

    expect(listings.findHeldForProducts).toHaveBeenCalledWith(WS, ['p1']);
    expect(queue.jobs).toEqual([
      {
        kind: SyncJobKind.Delist,
        workspaceId: WS,
        connectionId: 'c1',
        productId: 'p1',
        deleted: { externalId: 'gid://1', productTitle: 'Mug' },
      },
    ]);
  });

  it('queues nothing when no channel holds the deleted product', async () => {
    const { bus, queue, listings } = setup();
    listings.findHeldForProducts.mockResolvedValue([]);

    await bus.productsDeleting({ workspaceId: WS, productIds: ['p9'] });

    expect(queue.jobs).toEqual([]);
  });
});
