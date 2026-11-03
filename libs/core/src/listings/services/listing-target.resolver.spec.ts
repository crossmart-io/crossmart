import { ListingStatus } from '@crossmart/database';
import { ListingTargetAction } from '../enums/listing-target-action.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  type ConnectorDouble,
  listingRecord,
  productDetail,
  publishedListing,
  syncConnection,
  syncJob,
} from '../testing/listing.fixtures.js';
import { ListingTargetResolver } from './listing-target.resolver.js';
import type { ProductSelectionService } from './product-selection.service.js';
import type { SyncProductLoader } from './sync-product.loader.js';

function setup({ selected = true, product = productDetail(), listing = listingRecord() } = {}) {
  const products = { find: vi.fn<SyncProductLoader['find']>().mockResolvedValue(product) };
  const selection = {
    includes: vi.fn<ProductSelectionService['includes']>().mockResolvedValue(selected),
  };
  const listings = {
    ensurePrimary: vi.fn<ListingSyncRepository['ensurePrimary']>().mockResolvedValue(listing),
    findPrimary: vi.fn<ListingSyncRepository['findPrimary']>().mockResolvedValue(listing),
  };
  const resolver = new ListingTargetResolver(
    products as unknown as SyncProductLoader,
    selection as unknown as ProductSelectionService,
    listings as unknown as ListingSyncRepository,
  );
  return { resolver, listings };
}

const connection = syncConnection({} as ConnectorDouble);

describe('ListingTargetResolver', () => {
  it('publishes a selected product, creating its pending listing', async () => {
    const { resolver, listings } = setup();

    const target = await resolver.forPublish(syncJob(), connection);

    expect(target.action).toBe(ListingTargetAction.Publish);
    expect(listings.ensurePrimary).toHaveBeenCalled();
  });

  it('delists an unselected product the channel holds, and skips one it does not', async () => {
    const held = setup({ selected: false, listing: publishedListing() });
    const notHeld = setup({ selected: false });
    const delisted = setup({
      selected: false,
      listing: publishedListing({ status: ListingStatus.DELISTED }),
    });

    expect((await held.resolver.forPublish(syncJob(), connection)).action).toBe(
      ListingTargetAction.Delist,
    );
    expect((await notHeld.resolver.forPublish(syncJob(), connection)).action).toBe(
      ListingTargetAction.Skip,
    );
    expect((await delisted.resolver.forDelist(syncJob())).action).toBe(ListingTargetAction.Skip);
    expect(held.listings.ensurePrimary).not.toHaveBeenCalled();
  });

  it('only updates prices of listings the channel holds', async () => {
    expect(await setup().resolver.forPriceUpdate(syncJob())).toBeNull();
    expect(
      await setup({ listing: publishedListing() }).resolver.forPriceUpdate(syncJob()),
    ).not.toBeNull();
  });
});
