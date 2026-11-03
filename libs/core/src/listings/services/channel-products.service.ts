import { Injectable } from '@nestjs/common';
import { toCursorPage } from '@crossmart/common';
import type { Prisma } from '@crossmart/database';
import { toProductSummary } from '../../catalog/mappers/product-view.mapper.js';
import { toProductListWhere } from '../../catalog/repositories/product-list.filter.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type {
  ChannelProductCounts,
  ChannelProductPage,
  ChannelProductQuery,
  ChannelProductRow,
} from '../entities/channel-product.js';
import type { ListingSummary } from '../entities/listing-views.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import {
  type ChannelProductRecord,
  ChannelProductsRepository,
  type ListingSummaryRecord,
} from '../repositories/channel-products.repository.js';
import {
  type ChannelProductScope,
  channelProductStateOf,
  channelProductStateWhere,
  shownListing,
} from '../rules/channel-product-state-where.js';
import { selectionWhere } from '../rules/selection-where.js';

const STATES = Object.values(ChannelProductState);

function toListingSummary(record: ListingSummaryRecord): ListingSummary {
  const { updatedAt: _updatedAt, ...summary } = record;
  return summary;
}

/**
 * A store's products: those it should have or still has, with where each stands on the channel.
 * Without a state it lists every product but the excluded ones; counts cover every state.
 */
@Injectable()
export class ChannelProductsService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: ChannelProductsRepository,
  ) {}

  async list(
    workspaceId: string,
    connectionId: string,
    query: ChannelProductQuery,
  ): Promise<ChannelProductPage> {
    const connection = await this.connections.get(workspaceId, connectionId);
    const scope = { workspaceId, connectionId, rule: connection.settings.productSelection };
    const search = toProductListWhere(workspaceId, { search: query.search });
    const where = query.state
      ? channelProductStateWhere(scope, query.state)
      : { NOT: channelProductStateWhere(scope, ChannelProductState.Excluded) };
    const [counts, records] = await Promise.all([
      this.count(scope, search),
      this.products.listPage({ AND: [where, search] }, connectionId, query),
    ]);
    const { rows, nextCursor } = toCursorPage(records, query.limit);
    return { items: await this.toRows(scope, rows), counts, nextCursor };
  }

  private async count(
    scope: ChannelProductScope,
    search: Prisma.ProductWhereInput,
  ): Promise<ChannelProductCounts> {
    const totals = await Promise.all(
      STATES.map((state) =>
        this.products.count({ AND: [channelProductStateWhere(scope, state), search] }),
      ),
    );
    return Object.fromEntries(
      STATES.map((state, index) => [state, totals[index] ?? 0]),
    ) as ChannelProductCounts;
  }

  /** Asks the selection about the whole page at once, then derives each row's state. */
  private async toRows(
    scope: ChannelProductScope,
    records: ChannelProductRecord[],
  ): Promise<ChannelProductRow[]> {
    const selected = await this.products.matchingIds(
      selectionWhere(scope),
      records.map((record) => record.id),
    );
    return records.map((record) => {
      const listing = shownListing(record.listings);
      return {
        product: toProductSummary(record),
        state: channelProductStateOf(selected.has(record.id), record.listings),
        listing: listing ? toListingSummary(listing) : null,
      };
    });
  }
}
