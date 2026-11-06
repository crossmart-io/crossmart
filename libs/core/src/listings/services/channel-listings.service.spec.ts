import { ListingStatus, ListingVisibility, ProductStatus } from '@crossmart/database';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import type { ChannelProductsRepository } from '../repositories/channel-products.repository.js';
import type { ListingRowRecord } from '../repositories/listing-sync.queries.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  CONNECTION_ID,
  connectionView,
  listingRecord,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ChannelListingsService } from './channel-listings.service.js';
import type { ListingDisplayResolver } from './listing-display.resolver.js';
import type { SyncConnection, SyncConnectionLoader } from './sync-connection.loader.js';

const QUERY = { limit: 25 };

function row(productId: string, status: ListingStatus): ListingRowRecord {
  return {
    ...listingRecord({ id: `listing-${productId}`, productId, status }),
    product: {
      title: productId,
      status: ProductStatus.ACTIVE,
      optionNames: [],
      media: [{ url: 'https://cdn.example.com/1.jpg' }],
      _count: { variants: 1 },
    },
  };
}

function setup(records: ListingRowRecord[]) {
  const store = connectionView({
    settings: {
      account: null,
      pricing: null,
      productSelection: { filter: null, includeProductIds: ['p-1'], excludeProductIds: ['p-2'] },
    },
  });
  const connections = {
    require: vi.fn<SyncConnectionLoader['require']>().mockResolvedValue({
      view: store,
    } as SyncConnection),
  };
  const listings = {
    listPage: vi.fn<ListingSyncRepository['listPage']>().mockResolvedValue({
      records,
      total: records.length,
    }),
    listRecentFailures: vi
      .fn<ListingSyncRepository['listRecentFailures']>()
      .mockResolvedValue(records),
  };
  const products = {
    matchingIds: vi
      .fn<ChannelProductsRepository['matchingIds']>()
      .mockResolvedValue(new Set(['p-1'])),
  };
  const displays = {
    resolve: vi.fn<ListingDisplayResolver['resolve']>(({ publishReadiness }, subject) => ({
      state: subject.selected ? ListingDisplayState.Published : ListingDisplayState.Removing,
      reason: publishReadiness.ready ? null : 'setup',
      requirement: null,
    })),
  };
  const service = new ChannelListingsService(
    connections as unknown as SyncConnectionLoader,
    listings as unknown as ListingSyncRepository,
    products as unknown as ChannelProductsRepository,
    displays as unknown as ListingDisplayResolver,
  );
  return { service, products, displays, listings, store };
}

describe('ChannelListingsService', () => {
  it('asks the selection about the whole page in one query, and shows each row’s state', async () => {
    const records = [row('p-1', ListingStatus.ACTIVE), row('p-2', ListingStatus.ACTIVE)];
    const { service, products, displays, store } = setup(records);

    const page = await service.list(WORKSPACE_ID, CONNECTION_ID, QUERY);

    expect(products.matchingIds).toHaveBeenCalledOnce();
    expect(products.matchingIds.mock.calls[0]?.[1]).toEqual(['p-1', 'p-2']);
    expect(page.items.map((item) => [item.productId, item.displayState])).toEqual([
      ['p-1', ListingDisplayState.Published],
      ['p-2', ListingDisplayState.Removing],
    ]);
    expect(displays.resolve).toHaveBeenLastCalledWith(store, {
      selected: false,
      removedByHand: true,
      listing: expect.objectContaining({ status: ListingStatus.ACTIVE }),
      candidate: {
        imageUrls: ['https://cdn.example.com/1.jpg'],
        active: true,
        optionNames: [],
        variantCount: 1,
      },
    });
  });

  it('checks the product as the store would show it, following its visibility override', async () => {
    const hidden: ListingRowRecord = {
      ...row('p-1', ListingStatus.PENDING),
      override: { visibility: ListingVisibility.HIDDEN },
    };
    const { service, displays } = setup([hidden]);

    await service.list(WORKSPACE_ID, CONNECTION_ID, QUERY);

    expect(displays.resolve.mock.calls[0]?.[1].candidate.active).toBe(false);
  });

  it('lists recent failures across stores in their order, each with its store', async () => {
    const other = connectionView({ id: 'conn-2', displayName: 'Other' });
    const records = [
      { ...row('p-1', ListingStatus.ERROR), connectionId: 'conn-2' },
      row('p-3', ListingStatus.ERROR),
      { ...row('p-4', ListingStatus.ERROR), connectionId: 'gone' },
    ];
    const { service, products, listings, store } = setup(records);

    const rows = await service.recentFailures(WORKSPACE_ID, [store, other], 5);

    expect(listings.listRecentFailures).toHaveBeenCalledWith(WORKSPACE_ID, 5);
    expect(products.matchingIds).toHaveBeenCalledTimes(2);
    expect(rows.map((item) => [item.productId, item.connectionId])).toEqual([
      ['p-1', 'conn-2'],
      ['p-3', CONNECTION_ID],
    ]);
  });
});
