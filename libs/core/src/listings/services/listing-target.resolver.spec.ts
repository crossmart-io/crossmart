import { ListingStatus, ListingVisibility, ProductStatus } from '@crossmart/database';
import { Feature } from '../../entitlements/enums/feature.enum.js';
import { planLimitReached } from '../../entitlements/testing/entitlement.fixtures.js';
import { ListingTargetAction } from '../enums/listing-target-action.enum.js';
import type { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import {
  type ConnectorDouble,
  listingRecord,
  overrideRecord,
  productDetail,
  publishedListing,
  syncConnection,
  syncJob,
} from '../testing/listing.fixtures.js';
import type { ActiveListingsGate } from './active-listings.gate.js';
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
  const gate = {
    refusalForOneMore: vi.fn<ActiveListingsGate['refusalForOneMore']>().mockResolvedValue(null),
  };
  const resolver = new ListingTargetResolver(
    products as unknown as SyncProductLoader,
    selection as unknown as ProductSelectionService,
    listings as unknown as ListingSyncRepository,
    gate as unknown as ActiveListingsGate,
  );
  return { resolver, listings, gate };
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

  describe('and the plan', () => {
    const refusal = planLimitReached(Feature.ActiveListings);

    it('blocks a publish that would add an active listing past the limit', async () => {
      const { resolver, gate } = setup();
      gate.refusalForOneMore.mockResolvedValueOnce(refusal);

      const target = await resolver.forPublish(syncJob(), connection);

      expect(target).toMatchObject({
        action: ListingTargetAction.Blocked,
        reason: refusal.message,
      });
      expect(gate.refusalForOneMore).toHaveBeenCalledWith(syncJob().workspaceId);
    });

    it('never asks for listings that are live already or stay hidden', async () => {
      const live = setup({ listing: publishedListing({ status: ListingStatus.ACTIVE }) });
      const draft = setup({ product: productDetail({ status: ProductStatus.DRAFT }) });
      const hidden = setup({
        listing: listingRecord({
          override: overrideRecord({ visibility: ListingVisibility.HIDDEN }),
        }),
      });

      for (const { resolver, gate } of [live, draft, hidden]) {
        expect((await resolver.forPublish(syncJob(), connection)).action).toBe(
          ListingTargetAction.Publish,
        );
        expect(gate.refusalForOneMore).not.toHaveBeenCalled();
      }
    });
  });
});
