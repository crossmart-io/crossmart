import { Injectable } from '@nestjs/common';
import {
  type SortDirection,
  sortWithTiebreak,
  type CountedRecords,
  type PageRequest,
  toPageWindow,
} from '@crossmart/common';
import { ListingStatus, type Prisma, PrismaService } from '@crossmart/database';
import type { ChannelProductSort } from '../enums/channel-product-state.enum.js';
import { PRODUCT_SUMMARY_INCLUDE } from '../../catalog/repositories/product.queries.js';

const LISTING_SUMMARY_SELECT = {
  id: true,
  status: true,
  source: true,
  externalId: true,
  externalUrl: true,
  lastError: true,
  missingRequirement: true,
  lastSyncedAt: true,
  syncRequestedAt: true,
  channelCategoryId: true,
  channelCategoryName: true,
  updatedAt: true,
  override: { select: { visibility: true } },
} satisfies Prisma.ListingSelect;

/**
 * The summary include, with each listing's state fields too. The summary already reads the
 * product's listings (for its store icons); this connection's are picked from them in code.
 */
const CHANNEL_PRODUCT_INCLUDE = {
  ...PRODUCT_SUMMARY_INCLUDE,
  listings: {
    ...PRODUCT_SUMMARY_INCLUDE.listings,
    where: {},
    select: { ...PRODUCT_SUMMARY_INCLUDE.listings.select, ...LISTING_SUMMARY_SELECT },
    orderBy: { updatedAt: 'desc' },
  },
} as const satisfies Prisma.ProductInclude;

type ChannelProductInclude = typeof CHANNEL_PRODUCT_INCLUDE;

/** What a store badge's display state reads: its listing, and its product as a channel checks it. */
const STORE_BADGE_LISTING_SELECT = {
  productId: true,
  connectionId: true,
  status: true,
  lastError: true,
  missingRequirement: true,
  syncRequestedAt: true,
  override: { select: { visibility: true } },
  product: {
    select: {
      status: true,
      optionNames: true,
      media: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
      _count: { select: { variants: true } },
    },
  },
} as const satisfies Prisma.ListingSelect;

export type StoreBadgeListingRecord = Prisma.ListingGetPayload<{
  select: typeof STORE_BADGE_LISTING_SELECT;
}>;

export type ChannelProductRecord = Prisma.ProductGetPayload<{ include: ChannelProductInclude }>;

/**
 * What a product's display state on a store reads, and nothing more, for a whole-store scan.
 * Each listing names its store, so the store's are picked in code, as the page's rows do.
 */
const DISPLAY_CANDIDATE_SELECT = {
  id: true,
  status: true,
  optionNames: true,
  media: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
  _count: { select: { variants: true } },
  listings: {
    select: {
      connectionId: true,
      status: true,
      lastError: true,
      missingRequirement: true,
      syncRequestedAt: true,
      override: { select: { visibility: true } },
    },
    orderBy: { updatedAt: 'desc' },
  },
} as const satisfies Prisma.ProductSelect;

export type DisplayCandidateRecord = Prisma.ProductGetPayload<{
  select: typeof DISPLAY_CANDIDATE_SELECT;
}>;

/** Reads catalog products with their listings. Every condition is workspace-scoped. */
@Injectable()
export class ChannelProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({ where });
  }

  /** One page in title order, plus one extra row that says whether more exist. */
  async listPage(
    where: Prisma.ProductWhereInput,
    page: PageRequest & { sort: ChannelProductSort; direction: SortDirection },
  ): Promise<CountedRecords<ChannelProductRecord>> {
    const [records, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: CHANNEL_PRODUCT_INCLUDE,
        orderBy: sortWithTiebreak(page.sort, page.direction),
        ...toPageWindow(page),
      }),
      this.prisma.product.count({ where }),
    ]);
    return { records, total };
  }

  /**
   * The listings the store badges of a page show, oldest first, in one query: those of
   * `productIds` on `connectionIds` that are not delisted.
   */
  listStoreBadgeListings(
    workspaceId: string,
    productIds: string[],
    connectionIds: string[],
  ): Promise<StoreBadgeListingRecord[]> {
    return this.prisma.listing.findMany({
      where: {
        workspaceId,
        productId: { in: productIds },
        connectionId: { in: connectionIds },
        status: { not: ListingStatus.DELISTED },
      },
      select: STORE_BADGE_LISTING_SELECT,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  /**
   * Every product of `where` in the list's order, with only what its display state reads, so a
   * filter on display state can run over a whole store in one query.
   */
  listDisplayCandidates(
    where: Prisma.ProductWhereInput,
    order: { sort: ChannelProductSort; direction: SortDirection },
  ): Promise<DisplayCandidateRecord[]> {
    return this.prisma.product.findMany({
      where,
      select: DISPLAY_CANDIDATE_SELECT,
      orderBy: sortWithTiebreak(order.sort, order.direction),
    });
  }

  /** The ids of every product of `where`. */
  async listIds(where: Prisma.ProductWhereInput): Promise<Set<string>> {
    const rows = await this.prisma.product.findMany({ where, select: { id: true } });
    return new Set(rows.map((row) => row.id));
  }

  /** The products of one page by id, in the order of `productIds`. */
  async findByIds(workspaceId: string, productIds: string[]): Promise<ChannelProductRecord[]> {
    const records = await this.prisma.product.findMany({
      where: { workspaceId, id: { in: productIds } },
      include: CHANNEL_PRODUCT_INCLUDE,
    });
    const byId = new Map(records.map((record) => [record.id, record]));
    return productIds.flatMap((productId) => {
      const record = byId.get(productId);
      return record ? [record] : [];
    });
  }

  /** Which of `productIds` match `where`, in one query for a whole page. */
  async matchingIds(where: Prisma.ProductWhereInput, productIds: string[]): Promise<Set<string>> {
    const rows = await this.prisma.product.findMany({
      where: { AND: [where, { id: { in: productIds } }] },
      select: { id: true },
    });
    return new Set(rows.map((row) => row.id));
  }
}
