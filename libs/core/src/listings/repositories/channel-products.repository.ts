import { Injectable } from '@nestjs/common';
import {
  type SortDirection,
  sortWithTiebreak,
  type CountedRecords,
  type PageRequest,
  toPageWindow,
} from '@crossmart/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { ChannelProductSort } from '../enums/channel-product-state.enum.js';
import { PRODUCT_SUMMARY_INCLUDE } from '../../catalog/repositories/product.queries.js';

const LISTING_SUMMARY_SELECT = {
  id: true,
  status: true,
  source: true,
  externalId: true,
  externalUrl: true,
  lastError: true,
  lastSyncedAt: true,
  updatedAt: true,
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

export type ChannelProductRecord = Prisma.ProductGetPayload<{ include: ChannelProductInclude }>;

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

  /** Which of `productIds` match `where`, in one query for a whole page. */
  async matchingIds(where: Prisma.ProductWhereInput, productIds: string[]): Promise<Set<string>> {
    const rows = await this.prisma.product.findMany({
      where: { AND: [where, { id: { in: productIds } }] },
      select: { id: true },
    });
    return new Set(rows.map((row) => row.id));
  }
}
