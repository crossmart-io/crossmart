import { Injectable } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
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
import { toDisplayFields, toListingSummary } from '../mappers/listing.mapper.js';
import { publishCandidateOf } from '../rules/publish-candidate.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import {
  type ChannelProductRecord,
  ChannelProductsRepository,
} from '../repositories/channel-products.repository.js';
import {
  type ChannelProductScope,
  channelProductStateOf,
  channelProductStateWhere,
  OUT_OF_STORE_STATES,
  shownListing,
} from '../rules/channel-product-state-where.js';
import { selectionWhere } from '../rules/selection-where.js';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import { ListingDisplayResolver } from './listing-display.resolver.js';
import { ProductStoreDisplays } from './product-store-displays.js';
import type { DisplayedProductSummary } from '../entities/store-badge-display.js';

const STATES = Object.values(ChannelProductState);

/** What a page's rows share: their store, and which of the page's products it selects. */
interface RowContext {
  connection: ChannelConnectionView;
  selected: ReadonlySet<string>;
  removedByHand: ReadonlySet<string>;
}

/**
 * A store's products: those it should have or still has, with where each stands on the channel.
 * Without a state it lists the products in the store (not those excluded or removed by hand);
 * counts cover every state.
 */
@Injectable()
export class ChannelProductsService {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly products: ChannelProductsRepository,
    private readonly displays: ListingDisplayResolver,
    private readonly storeDisplays: ProductStoreDisplays,
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
      : { NOT: { OR: OUT_OF_STORE_STATES.map((state) => channelProductStateWhere(scope, state)) } };
    const [counts, records] = await Promise.all([
      this.count(scope, search),
      this.products.listPage({ AND: [where, search] }, query),
    ]);
    const { rows, nextCursor, total } = toCountedPage(records, query.limit);
    return { items: await this.toRows(connection, scope, rows), counts, nextCursor, total };
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

  /** Asks the selection and the store badges about the whole page at once, then maps each row. */
  private async toRows(
    connection: ChannelConnectionView,
    scope: ChannelProductScope,
    records: ChannelProductRecord[],
  ): Promise<ChannelProductRow[]> {
    const [selected, products] = await Promise.all([
      this.products.matchingIds(
        selectionWhere(scope),
        records.map((record) => record.id),
      ),
      this.storeDisplays.display(
        scope.workspaceId,
        records.map((record) => toProductSummary(record)),
      ),
    ]);
    const context = {
      connection,
      selected,
      removedByHand: new Set(scope.rule?.excludeProductIds ?? []),
    };
    return records.flatMap((record, index) => {
      const product = products[index];
      return product ? [this.toRow(record, product, context)] : [];
    });
  }

  private toRow(
    record: ChannelProductRecord,
    product: DisplayedProductSummary,
    context: RowContext,
  ): ChannelProductRow {
    const { connection } = context;
    const listings = record.listings.filter((entry) => entry.connectionId === connection.id);
    const shown = shownListing(listings);
    const listing = shown ? toListingSummary(shown) : null;
    const selected = context.selected.has(record.id);
    const removedByHand = context.removedByHand.has(record.id);
    const candidate = publishCandidateOf(
      {
        status: record.status,
        optionNames: record.optionNames,
        variantCount: record.variants.length,
        imageUrls: product.imageUrl ? [product.imageUrl] : [],
      },
      shown,
    );
    const display = this.displays.resolve(connection, {
      selected,
      removedByHand,
      listing,
      candidate,
    });
    return {
      product,
      state: channelProductStateOf(selected, listings, removedByHand),
      ...toDisplayFields(display),
      listing,
    };
  }
}
