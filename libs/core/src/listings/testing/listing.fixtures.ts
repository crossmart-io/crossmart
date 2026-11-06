import { ChannelType } from '@crossmart/connectors';
import {
  ChannelConnectionStatus,
  ListingSource,
  ListingStatus,
  OutOfStockPolicy,
  Prisma,
  ProductStatus,
} from '@crossmart/database';
import type { ProductDetail, VariantView } from '../../catalog/entities/product-views.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ListingSyncJob } from '../entities/listing-sync-job.js';
import { SyncJobKind } from '../enums/sync-job-kind.enum.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import type { SyncConnection } from '../services/sync-connection.loader.js';

export const WORKSPACE_ID = '0b6c1d4e-7f0a-4c55-9a39-3c1f4b7e9d01';
export const CONNECTION_ID = '9d8c7b6a-5f4e-4d3c-8b2a-1f0e9d8c7b6a';
export const PRODUCT_ID = '3f1c2b7a-9e8d-4c6b-a5f4-e3d2c1b0a9f8';
export const LISTING_ID = '7a6b5c4d-3e2f-4a1b-9c8d-7e6f5a4b3c2d';
export const VARIANT_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const AT = new Date('2026-11-03T09:00:00Z');

export function variantView(overrides: Partial<VariantView> = {}): VariantView {
  return {
    id: VARIANT_ID,
    position: 0,
    sku: 'MUG-1',
    barcode: null,
    optionValues: ['Blue'],
    price: '89.00',
    compareAtPrice: null,
    cost: '40.00',
    weightGrams: 300,
    requiresShipping: true,
    taxable: true,
    outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
    tracked: true,
    available: 12,
    ...overrides,
  };
}

export function productDetail(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: PRODUCT_ID,
    handle: 'mug',
    title: 'Mug',
    descriptionHtml: '<p>Stoneware.</p>',
    vendor: 'Acme',
    productType: 'Mugs',
    tags: ['kitchen'],
    status: ProductStatus.ACTIVE,
    optionNames: ['Color'],
    variants: [variantView()],
    media: [
      { id: 'm1', url: 'https://cdn.example.com/1.jpg', altText: 'Front', position: 0 },
      { id: 'm2', url: 'https://cdn.example.com/2.jpg', altText: null, position: 1 },
    ],
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

export function listingRecord(overrides: Partial<ListingSyncRecord> = {}): ListingSyncRecord {
  return {
    id: LISTING_ID,
    workspaceId: WORKSPACE_ID,
    connectionId: CONNECTION_ID,
    productId: PRODUCT_ID,
    externalId: null,
    externalUrl: null,
    status: ListingStatus.PENDING,
    source: ListingSource.RULE,
    lastError: null,
    missingRequirement: null,
    lastSyncedAt: null,
    mediaDigest: null,
    channelCategoryId: null,
    channelCategoryName: null,
    variants: [],
    override: null,
    variantOverrides: [],
    itemSpecifics: [],
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

export function publishedListing(overrides: Partial<ListingSyncRecord> = {}): ListingSyncRecord {
  return listingRecord({
    externalId: 'gid://shopify/Product/1',
    status: ListingStatus.ACTIVE,
    variants: [
      {
        id: 'lv-1',
        workspaceId: WORKSPACE_ID,
        listingId: LISTING_ID,
        variantId: VARIANT_ID,
        externalId: 'gid://shopify/ProductVariant/1',
        externalInventoryId: 'gid://shopify/InventoryItem/1',
        createdAt: AT,
        updatedAt: AT,
      },
    ],
    ...overrides,
  });
}

export function overrideRecord(
  overrides: Partial<NonNullable<ListingSyncRecord['override']>> = {},
): NonNullable<ListingSyncRecord['override']> {
  return {
    id: 'override-1',
    workspaceId: WORKSPACE_ID,
    listingId: LISTING_ID,
    title: null,
    descriptionHtml: null,
    tagsOverridden: false,
    tags: [],
    mediaOverridden: false,
    mediaUrls: [],
    visibility: null,
    inventoryBuffer: null,
    maxQuantity: null,
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

export function variantPriceOverride(price: string): ListingSyncRecord['variantOverrides'][number] {
  return {
    id: 'vo-1',
    workspaceId: WORKSPACE_ID,
    listingId: LISTING_ID,
    variantId: VARIANT_ID,
    price: new Prisma.Decimal(price),
    compareAtPrice: null,
    createdAt: AT,
    updatedAt: AT,
  };
}

export function connectionView(
  overrides: Partial<ChannelConnectionView> = {},
): ChannelConnectionView {
  return {
    id: CONNECTION_ID,
    channel: ChannelType.Shopify,
    externalAccountId: 'demo.myshopify.com',
    displayName: 'Demo Store',
    status: ChannelConnectionStatus.CONNECTED,
    statusReason: null,
    grantedScopes: [],
    missingFeatures: [],
    settings: { account: null, productSelection: null, pricing: null },
    publishReadiness: { ready: true, unmet: [] },
    connectedAt: AT,
    disconnectedAt: null,
    lastSyncedAt: null,
    createdAt: AT,
    updatedAt: AT,
    ...overrides,
  };
}

export function syncJob(kind: ListingSyncJob['kind'] = SyncJobKind.Content): ListingSyncJob {
  return { kind, workspaceId: WORKSPACE_ID, connectionId: CONNECTION_ID, productId: PRODUCT_ID };
}

export type ConnectorDouble = SyncConnection['connector'];

/** A loaded connection around a connector double, priced in USD without a rule. */
export function syncConnection(connector: ConnectorDouble): SyncConnection {
  return { view: connectionView(), connector, pricing: { rule: null, currencyCode: 'USD' } };
}
