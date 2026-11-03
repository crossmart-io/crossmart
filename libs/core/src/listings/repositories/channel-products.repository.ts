import { Injectable } from '@nestjs/common';
import { type SortDirection, sortWithTiebreak } from '@crossmart/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { ChannelProductSort } from '../enums/channel-product-state.enum.js';
import { PRODUCT_SUMMARY_INCLUDE } from '../../catalog/repositories/product.queries.js';

const LISTING_SUMMARY_SELECT = {
  id: true,
  status: true,
  externalId: true,
  externalUrl: true,
  lastError: true,
  lastSyncedAt: true,
  updatedAt: true,
} satisfies Prisma.ListingSelect;

const NEWEST_FIRST = { updatedAt: 'desc' } as const;

/** The summary include, plus the product's listings on one connection, newest first. */
type ChannelProductInclude = typeof PRODUCT_SUMMARY_INCLUDE & {
  listings: {
    where: { connectionId: string };
    select: typeof LISTING_SUMMARY_SELECT;
    orderBy: typeof NEWEST_FIRST;
  };
};

function channelProductInclude(connectionId: string): ChannelProductInclude {
  return {
    ...PRODUCT_SUMMARY_INCLUDE,
    listings: { where: { connectionId }, select: LISTING_SUMMARY_SELECT, orderBy: NEWEST_FIRST },
  } satisfies Prisma.ProductInclude;
}

export type ChannelProductRecord = Prisma.ProductGetPayload<{ include: ChannelProductInclude }>;

export type ListingSummaryRecord = ChannelProductRecord['listings'][number];

/** Reads catalog products with their listings on one connection. Conditions are workspace-scoped. */
@Injectable()
export class ChannelProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  count(where: Prisma.ProductWhereInput): Promise<number> {
    return this.prisma.product.count({ where });
  }

  /** One page in title order, plus one extra row that says whether more exist. */
  listPage(
    where: Prisma.ProductWhereInput,
    connectionId: string,
    page: { limit: number; cursor?: string; sort: ChannelProductSort; direction: SortDirection },
  ): Promise<ChannelProductRecord[]> {
    return this.prisma.product.findMany({
      where,
      include: channelProductInclude(connectionId),
      orderBy: sortWithTiebreak(page.sort, page.direction),
      take: page.limit + 1,
      ...(page.cursor ? { cursor: { id: page.cursor }, skip: 1 } : {}),
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
