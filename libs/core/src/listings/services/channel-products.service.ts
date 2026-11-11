import { Injectable } from '@nestjs/common';
import { type CountedRecords, toCountedPage } from '@crossmart/common';
import type { Prisma } from '@crossmart/database';
import { toProductListWhere } from '../../catalog/repositories/product-list.filter.js';
import { ChannelConnectionsService } from '../../channels/services/channel-connections.service.js';
import type { ChannelProductPage, ChannelProductQuery } from '../entities/channel-product.js';
import type { ChannelProductRecord } from '../repositories/channel-products.repository.js';
import {
  type ChannelProductScope,
  channelProductStateWhere,
} from '../rules/channel-product-state-where.js';
import {
  channelProductViewMatch,
  channelProductViewWhere,
  type DisplayMatch,
  displayStateMatch,
  inStoreWhere,
} from '../rules/channel-product-view.js';
import { displayStateWhere } from '../rules/display-state-where.js';
import { ChannelProductCounter } from './channel-product-counter.js';
import { ChannelProductDisplays, type DisplayFilterTarget } from './channel-product-displays.js';
import { ChannelProductRows } from './channel-product-rows.js';

/**
 * A store's products: those it should have or still has, with where each stands on the channel.
 * Without a state, display state or view it lists the products in the store (not those excluded
 * or removed by hand); counts cover every state, and the products that need details or
 * attention.
 */
@Injectable()
export class ChannelProductsService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly displays: ChannelProductDisplays,
    private readonly rows: ChannelProductRows,
    private readonly counter: ChannelProductCounter,
  ) {}

  async list(
    workspaceId: string,
    connectionId: string,
    query: ChannelProductQuery,
  ): Promise<ChannelProductPage> {
    const connection = await this.connections.get(workspaceId, connectionId);
    const scope = { workspaceId, connectionId, rule: connection.settings.productSelection };
    const target = { scope, connection };
    const search = toProductListWhere(workspaceId, { search: query.search });
    const where = { AND: [this.listWhere(scope, query), search] };
    const [counts, records] = await Promise.all([
      this.counter.count(target, search),
      this.listPage(target, where, query),
    ]);
    const { rows, nextCursor, total } = toCountedPage(records, query.limit);
    const items = await this.rows.toRows(connection, scope, rows);
    return { items, counts, nextCursor, total };
  }

  /** The products the filters ask for; without any, those in the store. */
  private listWhere(
    scope: ChannelProductScope,
    { state, displayState, view }: ChannelProductQuery,
  ): Prisma.ProductWhereInput {
    const conditions = [
      ...(state ? [channelProductStateWhere(scope, state)] : []),
      ...(displayState ? [displayStateWhere(scope, displayState)] : []),
      ...(view ? [channelProductViewWhere(scope, view)] : []),
    ];
    return conditions.length > 0 ? { AND: conditions } : inStoreWhere(scope);
  }

  /** A display state is resolved in code, so filtering on one pages in memory. */
  private listPage(
    target: DisplayFilterTarget,
    where: Prisma.ProductWhereInput,
    query: ChannelProductQuery,
  ): Promise<CountedRecords<ChannelProductRecord>> {
    return this.displays.page(target, where, query, this.displayMatch(query));
  }

  /** What the display state filter and the view keep, when either needs each display. */
  private displayMatch({ displayState, view }: ChannelProductQuery): DisplayMatch | null {
    const matches = [
      displayState ? displayStateMatch(displayState) : null,
      view ? channelProductViewMatch(view) : null,
    ].filter((match): match is DisplayMatch => match !== null);
    if (matches.length === 0) return null;
    return (display, refused) => matches.every((match) => match(display, refused));
  }
}
