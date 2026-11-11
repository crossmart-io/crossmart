import { Injectable } from '@nestjs/common';
import { ListingStatus, PrismaService } from '@crossmart/database';
import { SortDirection } from '@crossmart/common';
import {
  FAILED_LISTING_SELECT,
  type FailedListingGroupRecord,
  type FailedListingRecord,
} from './attention.queries.js';

const pairKey = (productId: string, connectionId: string): string => `${productId}:${connectionId}`;

/**
 * The listing reads of the attention summary that no page needs on its own. Each runs a fixed
 * number of queries, on the `(workspace_id, status)` and `(connection_id, status)` indexes.
 */
@Injectable()
export class AttentionRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Listings not delisted, per store, for the stores named. */
  async countLiveListings(
    workspaceId: string,
    connectionIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (connectionIds.length === 0) return new Map();
    const groups = await this.prisma.listing.groupBy({
      by: ['connectionId'],
      where: {
        workspaceId,
        connectionId: { in: [...connectionIds] },
        status: { not: ListingStatus.DELISTED },
      },
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.connectionId, group._count._all]));
  }

  /** The latest `limit` products with failed listings, per store, latest failure first. */
  async listFailedGroups(workspaceId: string, limit: number): Promise<FailedListingGroupRecord[]> {
    const groups = await this.prisma.listing.groupBy({
      by: ['productId', 'connectionId'],
      where: { workspaceId, status: ListingStatus.ERROR },
      _count: { _all: true },
      _max: { updatedAt: true },
      orderBy: [
        { _max: { updatedAt: SortDirection.Desc } },
        { productId: SortDirection.Asc },
        { connectionId: SortDirection.Asc },
      ],
      take: limit,
    });
    const latest = await this.latestFailures(workspaceId, groups);
    return groups.flatMap(({ productId, connectionId, _count }) => {
      const record = latest.get(pairKey(productId, connectionId));
      return record
        ? [{ productId, connectionId, failedListings: _count._all, latest: record }]
        : [];
    });
  }

  /** The newest failed listing of each product and store pair, in one query. */
  private async latestFailures(
    workspaceId: string,
    pairs: readonly { productId: string; connectionId: string }[],
  ): Promise<Map<string, FailedListingRecord>> {
    if (pairs.length === 0) return new Map();
    const records = await this.prisma.listing.findMany({
      where: {
        workspaceId,
        status: ListingStatus.ERROR,
        OR: pairs.map(({ productId, connectionId }) => ({ productId, connectionId })),
      },
      select: FAILED_LISTING_SELECT,
      orderBy: [{ updatedAt: SortDirection.Desc }, { id: SortDirection.Desc }],
    });
    const latest = new Map<string, FailedListingRecord>();
    for (const record of records) {
      const key = pairKey(record.productId, record.connectionId);
      if (!latest.has(key)) latest.set(key, record);
    }
    return latest;
  }
}
