import { Injectable } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type {
  ChannelListingPage,
  ChannelListingQuery,
  ChannelListingRow,
  StoreListingRow,
} from '../entities/listing-views.js';
import { toChannelListingRow, toListingSummary } from '../mappers/listing.mapper.js';
import { ChannelProductsRepository } from '../repositories/channel-products.repository.js';
import type { ListingRowRecord } from '../repositories/listing-sync.queries.js';
import { ListingSyncRepository } from '../repositories/listing-sync.repository.js';
import { publishCandidateOfRecord } from '../rules/publish-candidate.js';
import { selectionWhere } from '../rules/selection-where.js';
import { ListingDisplayResolver } from './listing-display.resolver.js';
import { SyncConnectionLoader } from './sync-connection.loader.js';

function groupByConnection(records: ListingRowRecord[]): Map<string, ListingRowRecord[]> {
  const groups = new Map<string, ListingRowRecord[]>();
  for (const record of records) {
    groups.set(record.connectionId, [...(groups.get(record.connectionId) ?? []), record]);
  }
  return groups;
}

/** A connection's listings, newest change first. */
@Injectable()
export class ChannelListingsService {
  constructor(
    private readonly connections: SyncConnectionLoader,
    private readonly listings: ListingSyncRepository,
    private readonly products: ChannelProductsRepository,
    private readonly displays: ListingDisplayResolver,
  ) {}

  /** How many listings failed in each store, so the stores that need attention stand out. */
  failedCounts(workspaceId: string): Promise<Map<string, number>> {
    return this.listings.countFailedByConnection(workspaceId);
  }

  async list(
    workspaceId: string,
    connectionId: string,
    query: ChannelListingQuery,
  ): Promise<ChannelListingPage> {
    const { view } = await this.connections.require(workspaceId, connectionId);
    const { rows, nextCursor, total } = toCountedPage(
      await this.listings.listPage(workspaceId, connectionId, query),
      query.limit,
    );
    return { items: await this.toRows(workspaceId, view, rows), nextCursor, total };
  }

  /**
   * The workspace's latest failed listings across `stores`, latest change first, each with its
   * display state so a client can link to the fix. One selection query per store involved.
   */
  async recentFailures(
    workspaceId: string,
    stores: readonly ChannelConnectionView[],
    limit: number,
  ): Promise<StoreListingRow[]> {
    const records = await this.listings.listRecentFailures(workspaceId, limit);
    const byId = new Map(stores.map((store) => [store.id, store]));
    const groups = await Promise.all(
      [...groupByConnection(records)].map(async ([connectionId, group]) => {
        const store = byId.get(connectionId);
        return store ? this.toRows(workspaceId, store, group) : [];
      }),
    );
    const rows = new Map(groups.flat().map((row) => [row.id, row]));
    return records.flatMap((record) => {
      const row = rows.get(record.id);
      return row ? [{ ...row, connectionId: record.connectionId }] : [];
    });
  }

  /** Asks the selection about the whole page in one query, then derives each row's state. */
  private async toRows(
    workspaceId: string,
    connection: ChannelConnectionView,
    records: ListingRowRecord[],
  ): Promise<ChannelListingRow[]> {
    const rule = connection.settings.productSelection;
    const selected = await this.products.matchingIds(
      selectionWhere({ workspaceId, connectionId: connection.id, rule }),
      records.map((record) => record.productId),
    );
    const removedByHand = new Set(rule?.excludeProductIds ?? []);
    return records.map((record) =>
      toChannelListingRow(
        record,
        this.displays.resolve(connection, {
          selected: selected.has(record.productId),
          removedByHand: removedByHand.has(record.productId),
          listing: toListingSummary(record),
          candidate: publishCandidateOfRecord(record.product, record),
        }),
      ),
    );
  }
}
