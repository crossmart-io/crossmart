import {
  ChannelCapability,
  type ChannelConnector,
  type ChannelConnectorRegistry,
  PublishRequirement,
} from '@crossmart/connectors';
import { SortDirection } from '@crossmart/common';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import { ChannelProductSort } from '../enums/channel-product-state.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import type {
  ChannelProductRecord,
  ChannelProductsRepository,
  DisplayCandidateRecord,
} from '../repositories/channel-products.repository.js';
import { CONNECTION_ID, connectionView, WORKSPACE_ID } from '../testing/listing.fixtures.js';
import { ChannelProductDisplays } from './channel-product-displays.js';
import { ListingDisplayResolver } from './listing-display.resolver.js';

const NEEDS_IMAGES = { requirement: PublishRequirement.Images, reason: 'Add an image' };

function candidate(
  id: string,
  imageUrls: string[],
  status?: ListingStatus,
): DisplayCandidateRecord {
  return {
    id,
    status: ProductStatus.ACTIVE,
    optionNames: [],
    media: imageUrls.map((url) => ({ url })),
    _count: { variants: 1 },
    listings: status
      ? [
          {
            connectionId: CONNECTION_ID,
            status,
            lastError: null,
            missingRequirement: null,
            syncRequestedAt: null,
            override: null,
          },
        ]
      : [],
  };
}

/** p-1 and p-3 are ready, p-2 lacks images, p-4 is on the channel. */
const CANDIDATES = [
  candidate('p-1', ['https://cdn.example.com/1.jpg']),
  candidate('p-2', []),
  candidate('p-3', ['https://cdn.example.com/3.jpg'], ListingStatus.PENDING),
  candidate('p-4', ['https://cdn.example.com/4.jpg'], ListingStatus.ACTIVE),
];

function setup() {
  const products = {
    listDisplayCandidates: vi
      .fn<ChannelProductsRepository['listDisplayCandidates']>()
      .mockResolvedValue(CANDIDATES),
    listIds: vi
      .fn<ChannelProductsRepository['listIds']>()
      .mockResolvedValue(new Set(['p-1', 'p-2', 'p-4'])),
    findByIds: vi
      .fn<ChannelProductsRepository['findByIds']>()
      .mockImplementation((_workspaceId, ids) =>
        Promise.resolve(ids.map((id) => ({ id }) as ChannelProductRecord)),
      ),
  };
  const connector = {
    capabilities: new Set([ChannelCapability.PublishListings]),
    unmetProductRequirements: (product: { imageUrls: readonly string[] }) =>
      product.imageUrls.length > 0 ? [] : [NEEDS_IMAGES],
  };
  const registry = { require: vi.fn(() => connector as unknown as ChannelConnector) };
  const filter = new ChannelProductDisplays(
    products as unknown as ChannelProductsRepository,
    new ListingDisplayResolver(registry as unknown as ChannelConnectorRegistry),
  );
  const target = {
    scope: { workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, rule: null },
    connection: connectionView(),
  };
  return { filter, products, target };
}

function query(displayState: ListingDisplayState, page?: number) {
  return {
    displayState,
    sort: ChannelProductSort.Title,
    direction: SortDirection.Asc,
    limit: 1,
    page,
  };
}

describe('ChannelProductDisplays', () => {
  it('keeps the products in the display state, in order, with how many match', async () => {
    const { filter, products, target } = setup();

    const page = await filter.page(target, {}, query(ListingDisplayState.Ready));

    expect(page.total).toBe(1);
    expect(page.records.map((record) => record.id)).toEqual(['p-1']);
    expect(products.findByIds).toHaveBeenCalledWith(WORKSPACE_ID, ['p-1']);
  });

  it('asks the connector what each product lacks', async () => {
    const { filter, target } = setup();

    const page = await filter.page(target, {}, query(ListingDisplayState.NeedsDetails));

    expect(page.records.map((record) => record.id)).toEqual(['p-2']);
  });

  it('loads only the page asked for, plus one row that says more exist', async () => {
    const { filter, products, target } = setup();
    const image = ['https://cdn.example.com/1.jpg'];
    products.listDisplayCandidates.mockResolvedValue(
      ['a', 'b', 'c'].map((id) => candidate(id, image)),
    );
    products.listIds.mockResolvedValue(new Set(['a', 'b', 'c']));

    const page = await filter.page(target, {}, query(ListingDisplayState.Ready, 2));

    expect(products.findByIds).toHaveBeenCalledWith(WORKSPACE_ID, ['b', 'c']);
    expect(page.total).toBe(3);
  });

  it('ignores the product’s listings on other stores', async () => {
    const { filter, products, target } = setup();
    const elsewhere = candidate('p-1', ['https://cdn.example.com/1.jpg'], ListingStatus.ACTIVE);
    elsewhere.listings = elsewhere.listings.map((entry) => ({ ...entry, connectionId: 'other' }));
    products.listDisplayCandidates.mockResolvedValue([elsewhere]);

    const page = await filter.page(target, {}, query(ListingDisplayState.Ready));

    expect(page.records.map((record) => record.id)).toEqual(['p-1']);
  });

  it('reads the candidates and the selection in two queries, whatever the store’s size', async () => {
    const { filter, products, target } = setup();

    await filter.page(target, { workspaceId: WORKSPACE_ID }, query(ListingDisplayState.Published));

    expect(products.listDisplayCandidates).toHaveBeenCalledTimes(1);
    expect(products.listIds).toHaveBeenCalledTimes(1);
  });
});
