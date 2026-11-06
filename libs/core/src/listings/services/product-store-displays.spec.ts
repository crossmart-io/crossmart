import { ChannelType, PublishRequirement } from '@crossmart/connectors';
import { ListingSource, ListingStatus, ProductStatus } from '@crossmart/database';
import type { ProductSummary } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import type {
  ChannelProductsRepository,
  StoreBadgeListingRecord,
} from '../repositories/channel-products.repository.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import type { ListingDisplayResolver } from './listing-display.resolver.js';
import { ProductStoreDisplays } from './product-store-displays.js';

const OTHER_STORE = 'store-2';
const NO_POLICY = { requirement: PublishRequirement.ShippingPolicy, reason: 'Choose a policy' };

function summary(id: string, connectionIds: string[]): ProductSummary {
  return {
    id,
    handle: id,
    title: id,
    status: ProductStatus.ACTIVE,
    vendor: null,
    productType: null,
    variantCount: 1,
    totalAvailable: null,
    priceRange: null,
    imageUrl: null,
    stores: connectionIds.map((connectionId) => ({
      connectionId,
      channel: ChannelType.Shopify,
      storeName: connectionId,
      status: ListingStatus.ACTIVE,
      source: ListingSource.RULE,
    })),
    updatedAt: new Date(),
  };
}

function badgeListing(
  productId: string,
  connectionId: string,
  status: ListingStatus,
): StoreBadgeListingRecord {
  return {
    productId,
    connectionId,
    status,
    lastError: null,
    missingRequirement: null,
    syncRequestedAt: null,
    override: null,
    product: {
      status: ProductStatus.ACTIVE,
      optionNames: [],
      media: [{ url: 'https://cdn.example.com/1.jpg' }],
      _count: { variants: 1 },
    },
  };
}

function setup(records: StoreBadgeListingRecord[]) {
  const stores = [
    connectionView(),
    connectionView({ id: OTHER_STORE, publishReadiness: { ready: false, unmet: [NO_POLICY] } }),
  ];
  const connections = {
    list: vi.fn<ChannelConnectionsService['list']>().mockResolvedValue(stores),
  };
  const products = {
    listStoreBadgeListings: vi
      .fn<ChannelProductsRepository['listStoreBadgeListings']>()
      .mockResolvedValue(records),
    matchingIds: vi
      .fn<ChannelProductsRepository['matchingIds']>()
      .mockImplementation((_where, productIds) => Promise.resolve(new Set(productIds))),
  };
  const resolve = vi.fn<ListingDisplayResolver['resolve']>((store, subject) => ({
    state: store.publishReadiness.ready
      ? ListingDisplayState.Published
      : ListingDisplayState.NeedsDetails,
    reason: store.publishReadiness.unmet[0]?.reason ?? null,
    requirement: store.publishReadiness.unmet[0]?.requirement ?? null,
    ...(subject.selected ? {} : { state: ListingDisplayState.Removing }),
  }));
  const service = new ProductStoreDisplays(
    connections as unknown as ChannelConnectionsService,
    products as unknown as ChannelProductsRepository,
    { resolve } as unknown as ListingDisplayResolver,
  );
  return { service, connections, products, resolve };
}

describe('ProductStoreDisplays', () => {
  it('gives each badge its store’s display, with a fixed number of queries per page', async () => {
    const { service, connections, products } = setup([
      badgeListing('p-1', CONNECTION_ID, ListingStatus.ACTIVE),
      badgeListing('p-1', OTHER_STORE, ListingStatus.PENDING),
      badgeListing('p-2', CONNECTION_ID, ListingStatus.ACTIVE),
    ]);

    const [first, second] = await service.display(WORKSPACE_ID, [
      summary('p-1', [CONNECTION_ID, OTHER_STORE]),
      summary('p-2', [CONNECTION_ID]),
    ]);

    expect(connections.list).toHaveBeenCalledOnce();
    expect(products.listStoreBadgeListings).toHaveBeenCalledOnce();
    expect(products.listStoreBadgeListings).toHaveBeenCalledWith(
      WORKSPACE_ID,
      ['p-1', 'p-2'],
      [CONNECTION_ID, OTHER_STORE],
    );
    expect(products.matchingIds).toHaveBeenCalledTimes(2);
    expect(first?.stores).toEqual([
      expect.objectContaining({
        connectionId: CONNECTION_ID,
        displayState: ListingDisplayState.Published,
        displayRequirement: null,
      }),
      expect.objectContaining({
        connectionId: OTHER_STORE,
        displayState: ListingDisplayState.NeedsDetails,
        displayReason: NO_POLICY.reason,
        displayRequirement: PublishRequirement.ShippingPolicy,
      }),
    ]);
    expect(second?.stores[0]?.displayState).toBe(ListingDisplayState.Published);
  });

  it('asks each store about its own products only', async () => {
    const { service, products } = setup([badgeListing('p-2', OTHER_STORE, ListingStatus.ACTIVE)]);

    await service.display(WORKSPACE_ID, [summary('p-1', []), summary('p-2', [OTHER_STORE])]);

    expect(products.matchingIds).toHaveBeenCalledOnce();
    expect(products.matchingIds.mock.calls[0]?.[1]).toEqual(['p-2']);
  });

  it('queries nothing for a page without badges', async () => {
    const { service, connections, products } = setup([]);

    const items = await service.display(WORKSPACE_ID, [summary('p-1', [])]);

    expect(items[0]?.stores).toEqual([]);
    expect(connections.list).not.toHaveBeenCalled();
    expect(products.listStoreBadgeListings).not.toHaveBeenCalled();
  });

  it('falls back to the selection alone when the badge’s listing is gone', async () => {
    const { service, resolve } = setup([]);

    const [item] = await service.display(WORKSPACE_ID, [summary('p-1', [CONNECTION_ID])]);

    expect(resolve).not.toHaveBeenCalled();
    expect(item?.stores[0]?.displayState).toBe(ListingDisplayState.Ready);
  });
});
