import { requireEnumValue } from '@crossmart/common';
import { ChannelType } from '@crossmart/connectors';
import { ListingStatus, type Prisma } from '@crossmart/database';
import type {
  PriceRange,
  ProductDetail,
  ProductStoreBadge,
  ProductSummary,
} from '../entities/product-views.js';
import type { ProductDetailRecord, ProductSummaryRecord } from '../repositories/product.queries.js';
import { toAmount } from './decimal-amount.mapper.js';

function toPriceRange(prices: Prisma.Decimal[]): PriceRange | null {
  const [first, ...rest] = prices;
  if (!first) return null;
  let [min, max] = [first, first];
  for (const price of rest) {
    if (price.lessThan(min)) min = price;
    if (price.greaterThan(max)) max = price;
  }
  return { min: toAmount(min), max: toAmount(max) };
}

function toTotalAvailable(variants: ProductSummaryRecord['variants']): number | null {
  const tracked = variants.flatMap(({ inventoryItem }) =>
    inventoryItem?.tracked ? [inventoryItem.available] : [],
  );
  return tracked.length === 0 ? null : tracked.reduce((sum, available) => sum + available, 0);
}

/** One badge per store: a store with several listings of the product shows an error first. */
function toStores(listings: ProductSummaryRecord['listings']): ProductStoreBadge[] {
  const byStore = new Map<string, ProductStoreBadge>();
  for (const listing of listings) {
    const known = byStore.get(listing.connectionId);
    if (known && known.status === ListingStatus.ERROR) continue;
    if (known && listing.status !== ListingStatus.ERROR) continue;
    byStore.set(listing.connectionId, {
      connectionId: listing.connectionId,
      channel: requireEnumValue(ChannelType, listing.connection.channel),
      storeName: listing.connection.displayName,
      status: listing.status,
    });
  }
  return [...byStore.values()];
}

export function toProductSummary(record: ProductSummaryRecord): ProductSummary {
  return {
    id: record.id,
    handle: record.handle,
    title: record.title,
    status: record.status,
    vendor: record.vendor,
    productType: record.productType,
    variantCount: record.variants.length,
    totalAvailable: toTotalAvailable(record.variants),
    priceRange: toPriceRange(record.variants.map((variant) => variant.price)),
    imageUrl: record.media[0]?.url ?? null,
    stores: toStores(record.listings),
    updatedAt: record.updatedAt,
  };
}

export function toProductDetail(record: ProductDetailRecord): ProductDetail {
  return {
    id: record.id,
    handle: record.handle,
    title: record.title,
    descriptionHtml: record.descriptionHtml,
    vendor: record.vendor,
    productType: record.productType,
    tags: record.tags,
    status: record.status,
    optionNames: record.optionNames,
    variants: record.variants.map((variant) => ({
      id: variant.id,
      position: variant.position,
      sku: variant.sku,
      barcode: variant.barcode,
      optionValues: variant.optionValues,
      price: toAmount(variant.price),
      compareAtPrice: variant.compareAtPrice ? toAmount(variant.compareAtPrice) : null,
      cost: variant.cost ? toAmount(variant.cost) : null,
      weightGrams: variant.weightGrams,
      requiresShipping: variant.requiresShipping,
      taxable: variant.taxable,
      outOfStockPolicy: variant.outOfStockPolicy,
      tracked: variant.inventoryItem?.tracked ?? false,
      available: variant.inventoryItem?.available ?? 0,
    })),
    media: record.media.map(({ id, url, altText, position }) => ({ id, url, altText, position })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
