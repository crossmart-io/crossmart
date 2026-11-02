import type { Prisma } from '@crossmart/database';

const BY_POSITION = { position: 'asc' } as const;

/** Just enough of each product for a list row, loaded in one batched query per relation. */
export const PRODUCT_SUMMARY_INCLUDE = {
  variants: {
    select: { price: true, inventoryItem: { select: { tracked: true, available: true } } },
  },
  media: { select: { url: true }, orderBy: BY_POSITION, take: 1 },
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

/** What an update import needs to match a file's variants and keep the catalog's stock and images. */
export const PRODUCT_UPDATE_TARGET_SELECT = {
  id: true,
  handle: true,
  variants: {
    select: {
      id: true,
      sku: true,
      optionValues: true,
      inventoryItem: { select: { tracked: true, available: true } },
    },
    orderBy: BY_POSITION,
  },
  media: { select: { url: true, altText: true }, orderBy: BY_POSITION },
} satisfies Prisma.ProductSelect;

export type ProductUpdateTargetRecord = Prisma.ProductGetPayload<{
  select: typeof PRODUCT_UPDATE_TARGET_SELECT;
}>;
