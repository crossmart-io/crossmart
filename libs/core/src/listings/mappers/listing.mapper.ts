import { toAmount } from '../../catalog/mappers/decimal-amount.mapper.js';
import type {
  ListingOverrideView,
  VariantPriceOverrideInput,
} from '../entities/listing-override.js';
import type { ChannelListingRow, ListingSummary } from '../entities/listing-views.js';
import type { VariantPriceOverride } from '../entities/price-resolution.js';
import type { ListingRowRecord, ListingSyncRecord } from '../repositories/listing-sync.queries.js';

type ListingFields = Pick<
  ListingSyncRecord,
  | 'id'
  | 'status'
  | 'source'
  | 'externalId'
  | 'externalUrl'
  | 'lastError'
  | 'lastSyncedAt'
  | 'channelCategoryId'
  | 'channelCategoryName'
>;

export function toListingSummary(record: ListingFields): ListingSummary {
  const { channelCategoryId, channelCategoryName } = record;
  return {
    category: channelCategoryId ? { id: channelCategoryId, name: channelCategoryName ?? '' } : null,
    id: record.id,
    status: record.status,
    source: record.source,
    externalId: record.externalId,
    externalUrl: record.externalUrl,
    lastError: record.lastError,
    lastSyncedAt: record.lastSyncedAt,
  };
}

export function toChannelListingRow(record: ListingRowRecord): ChannelListingRow {
  return {
    ...toListingSummary(record),
    productId: record.productId,
    productTitle: record.product.title,
    imageUrl: record.product.media[0]?.url ?? null,
    variantCount: record.product._count.variants,
  };
}

const NO_CONTENT_OVERRIDES = {
  title: null,
  descriptionHtml: null,
  tags: null,
  mediaUrls: null,
  visibility: null,
  inventoryBuffer: null,
  maxQuantity: null,
} as const;

function toVariantPrices(record: ListingSyncRecord): VariantPriceOverrideInput[] {
  return record.variantOverrides.map((entry) => ({
    variantId: entry.variantId,
    price: entry.price ? toAmount(entry.price) : null,
    compareAtPrice: entry.compareAtPrice ? toAmount(entry.compareAtPrice) : null,
  }));
}

/** The listing's overrides, or null when it has none at all. */
export function toListingOverrideView(record: ListingSyncRecord): ListingOverrideView | null {
  const { override } = record;
  if (!override && record.variantOverrides.length === 0) return null;
  const content = override
    ? {
        title: override.title,
        descriptionHtml: override.descriptionHtml,
        tags: override.tagsOverridden ? override.tags : null,
        mediaUrls: override.mediaOverridden ? override.mediaUrls : null,
        visibility: override.visibility,
        inventoryBuffer: override.inventoryBuffer,
        maxQuantity: override.maxQuantity,
        updatedAt: override.updatedAt,
      }
    : { ...NO_CONTENT_OVERRIDES, updatedAt: record.updatedAt };
  return { ...content, variantPrices: toVariantPrices(record) };
}

/** Each variant's fixed prices on the listing, by variant id. */
export function toPriceOverrides(
  record: ListingSyncRecord | null,
): Map<string, VariantPriceOverride> {
  return new Map(
    (record ? toVariantPrices(record) : []).map(({ variantId, ...prices }) => [variantId, prices]),
  );
}
