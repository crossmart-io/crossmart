import { ChannelType } from '@crossmart/connectors';
import { ListingSource, ListingStatus, ProductStatus } from '@crossmart/database';
import type { ProductSummaryRecord } from '../repositories/product.queries.js';
import { toProductSummary } from './product-view.mapper.js';

const AT = new Date('2026-11-03T10:00:00Z');

function listing(connectionId: string, status: ListingStatus, displayName = 'Main store') {
  return {
    connectionId,
    status,
    source: ListingSource.MANUAL,
    connection: { channel: ChannelType.Shopify, displayName },
  };
}

function record(listings: ProductSummaryRecord['listings']): ProductSummaryRecord {
  return {
    id: 'p-1',
    workspaceId: 'ws-1',
    handle: 'mug',
    title: 'Mug',
    descriptionHtml: '',
    vendor: null,
    productType: null,
    tags: [],
    status: ProductStatus.ACTIVE,
    condition: null,
    optionNames: [],
    createdAt: AT,
    updatedAt: AT,
    variants: [],
    media: [],
    listings,
  };
}

describe('toProductSummary stores', () => {
  it('shows one badge per store, in the order the product joined them', () => {
    const summary = toProductSummary(
      record([
        listing('c-1', ListingStatus.ACTIVE),
        listing('c-2', ListingStatus.PENDING, 'Outlet'),
        listing('c-1', ListingStatus.INACTIVE),
      ]),
    );

    expect(summary.stores).toEqual([
      {
        connectionId: 'c-1',
        channel: ChannelType.Shopify,
        storeName: 'Main store',
        status: ListingStatus.ACTIVE,
        source: ListingSource.MANUAL,
      },
      {
        connectionId: 'c-2',
        channel: ChannelType.Shopify,
        storeName: 'Outlet',
        status: ListingStatus.PENDING,
        source: ListingSource.MANUAL,
      },
    ]);
  });

  it('shows an error first when a store has several listings of the product', () => {
    const summary = toProductSummary(
      record([listing('c-1', ListingStatus.ACTIVE), listing('c-1', ListingStatus.ERROR)]),
    );

    expect(summary.stores.map((store) => store.status)).toEqual([ListingStatus.ERROR]);
  });
});
