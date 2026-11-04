import { ListingStatus, type Prisma } from '@crossmart/database';
import { ProductStoreFilter } from '../enums/product-store-filter.enum.js';
import type { ProductFilters } from '../entities/product-views.js';
import { CATALOG_GAP_FILTERS } from './catalog-gap.filters.js';

const INSENSITIVE = 'insensitive' as const;

function searchFilter(search: string | undefined): Prisma.ProductWhereInput {
  const text = search?.trim();
  if (!text) return {};
  return {
    OR: [
      { title: { contains: text, mode: INSENSITIVE } },
      { handle: { contains: text, mode: INSENSITIVE } },
      { variants: { some: { sku: { contains: text, mode: INSENSITIVE } } } },
    ],
  };
}

/**
 * The catalog list filters as a Prisma condition, shared by the product list, saved views and
 * channel product selections, so a filter selects the same products everywhere. Absent filters
 * are not applied; tags match a product that has any of them.
 */
export function toProductListWhere(
  workspaceId: string,
  filters: ProductFilters,
): Prisma.ProductWhereInput {
  const vendor = filters.vendor?.trim();
  return {
    workspaceId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.gap ? CATALOG_GAP_FILTERS[filters.gap] : {}),
    ...(filters.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
    ...(vendor ? { vendor: { equals: vendor, mode: INSENSITIVE } } : {}),
    AND: [searchFilter(filters.search)],
  };
}

/** Listings that put a product in a store: anything but delisted. */
const IN_STORE_LISTING = { status: { not: ListingStatus.DELISTED } } as const;

/**
 * The products table's store filter. A product is in a store while it has a listing there that
 * is not delisted. `InStore` and `NotInStore` need `storeId`; the API refuses them without it.
 */
export function storeFilterWhere(
  filter: ProductStoreFilter | undefined,
  storeId: string | undefined,
): Prisma.ProductWhereInput {
  switch (filter) {
    case undefined:
      return {};
    case ProductStoreFilter.InStore:
      return { listings: { some: { ...IN_STORE_LISTING, connectionId: storeId } } };
    case ProductStoreFilter.NotInStore:
      return { listings: { none: { ...IN_STORE_LISTING, connectionId: storeId } } };
    case ProductStoreFilter.InNoStore:
      return { listings: { none: IN_STORE_LISTING } };
    case ProductStoreFilter.WithErrors:
      return { listings: { some: { status: ListingStatus.ERROR } } };
  }
}
