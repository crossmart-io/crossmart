import { ListingStatus, type Prisma } from '@crossmart/database';

/**
 * A listing with everything a sync reads: its variant ids on the channel, its overrides and its
 * item specifics.
 */
export const LISTING_SYNC_INCLUDE = {
  variants: true,
  override: true,
  variantOverrides: true,
  itemSpecifics: { select: { name: true, values: true }, orderBy: { name: 'asc' } },
} satisfies Prisma.ListingInclude;

export type ListingSyncRecord = Prisma.ListingGetPayload<{ include: typeof LISTING_SYNC_INCLUDE }>;

/** Variants with the stock a channel needs, for inventory syncs. */
export const LISTING_STOCK_INCLUDE = {
  product: { select: { title: true } },
  override: { select: { inventoryBuffer: true, maxQuantity: true } },
  variants: {
    select: {
      externalInventoryId: true,
      variant: { select: { inventoryItem: { select: { tracked: true, available: true } } } },
    },
  },
} satisfies Prisma.ListingInclude;

export type ListingStockRecord = Prisma.ListingGetPayload<{
  include: typeof LISTING_STOCK_INCLUDE;
}>;

export const LISTING_ROW_INCLUDE = {
  product: {
    select: {
      title: true,
      status: true,
      optionNames: true,
      media: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
      _count: { select: { variants: true } },
    },
  },
  override: { select: { visibility: true } },
} satisfies Prisma.ListingInclude;

export type ListingRowRecord = Prisma.ListingGetPayload<{ include: typeof LISTING_ROW_INCLUDE }>;

/** Listings the channel holds: published, and not taken off it. */
export function onChannel(): Prisma.ListingWhereInput {
  return { externalId: { not: null }, status: { not: ListingStatus.DELISTED } };
}

/** A connection and product a sync job is about. */
export interface ListingPair {
  connectionId: string;
  productId: string;
}

/** A listing a channel holds, with what delisting it needs once its product is deleted. */
export interface HeldListing extends ListingPair {
  externalId: string;
  productTitle: string;
  variantExternalIds: string[];
}
