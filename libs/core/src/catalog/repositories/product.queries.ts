import { ChannelConnectionStatus, ListingStatus, type Prisma } from '@crossmart/database';

const BY_POSITION = { position: 'asc' } as const;

/** Just enough of each product for a list row, loaded in one batched query per relation. */
export const PRODUCT_SUMMARY_INCLUDE = {
  variants: {
    select: { price: true, inventoryItem: { select: { tracked: true, available: true } } },
  },
  media: { select: { url: true }, orderBy: BY_POSITION, take: 1 },
  /** The stores the product is in, for the channel icons of its row. */
  listings: {
    where: {
      status: { not: ListingStatus.DELISTED },
      connection: { status: { not: ChannelConnectionStatus.DISCONNECTED } },
    },
    select: {
      connectionId: true,
      status: true,
      source: true,
      connection: { select: { channel: true, displayName: true } },
    },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ProductInclude;

export const PRODUCT_DETAIL_INCLUDE = {
  variants: { include: { inventoryItem: true }, orderBy: BY_POSITION },
  media: { orderBy: BY_POSITION },
} satisfies Prisma.ProductInclude;

export type ProductSummaryRecord = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_SUMMARY_INCLUDE;
}>;
export type ProductDetailRecord = Prisma.ProductGetPayload<{
  include: typeof PRODUCT_DETAIL_INCLUDE;
}>;

/** The catalog product an update import merges its file's changes into: everything it can keep. */
export const PRODUCT_UPDATE_TARGET_SELECT = {
  id: true,
  handle: true,
  title: true,
  descriptionHtml: true,
  vendor: true,
  productType: true,
  tags: true,
  status: true,
  condition: true,
  optionNames: true,
  variants: {
    select: {
      id: true,
      sku: true,
      barcode: true,
      optionValues: true,
      price: true,
      compareAtPrice: true,
      cost: true,
      weightGrams: true,
      requiresShipping: true,
      taxable: true,
      outOfStockPolicy: true,
      inventoryItem: { select: { tracked: true, available: true } },
    },
    orderBy: BY_POSITION,
  },
  media: { select: { url: true, altText: true }, orderBy: BY_POSITION },
} satisfies Prisma.ProductSelect;

export type ProductUpdateTargetRecord = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_UPDATE_TARGET_SELECT;
}>;
