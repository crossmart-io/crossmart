import { ListingStatus } from '@crossmart/database';
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
    })),
  };
  const service = new ChannelListingsService(
    connections as unknown as SyncConnectionLoader,
    listings as unknown as ListingSyncRepository,
    products as unknown as ChannelProductsRepository,
    displays as unknown as ListingDisplayResolver,
  );
  return { service, products, displays, store };
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
      imageUrls: ['https://cdn.example.com/1.jpg'],
    });
  });
});
