import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import type { ChannelConnectionView } from '../../channels/entities/channel-connection-view.js';
import type { ListingStateCounts } from '../entities/listing-state-counts.js';
import type { NeedsDetailsCounts } from '../entities/listing-state-counts.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { SELECTION_BATCH_SIZE } from '../listings.constants.js';
import {
  ChannelProductsRepository,
  type DisplayCandidateRecord,
} from '../repositories/channel-products.repository.js';
import {
  type ChannelProductScope,
  channelProductStateWhere,
} from '../rules/channel-product-state-where.js';
import { settledStateConditions, unsettledWhere } from '../rules/listing-state-where.js';
import {
  ChannelProductDisplays,
  type DisplayedStoreProduct,
  isRefused,
  type StoreMembership,
  toDisplayedStoreProduct,
} from './channel-product-displays.js';

/** Called with each unsettled product read, and the display state it resolved to. */
type UnsettledVisitor = (product: DisplayedStoreProduct, state: ListingDisplayState) => void;

const STATES = Object.values(ListingDisplayState);

function emptyCounts(): ListingStateCounts {
  return Object.fromEntries(STATES.map((state) => [state, 0])) as ListingStateCounts;
}

function sumCounts(...counts: ListingStateCounts[]): ListingStateCounts {
  const total = emptyCounts();
  for (const entry of counts) {
    for (const state of STATES) total[state] += entry[state];
  }
  return total;
}

function scopeOf(workspaceId: string, connection: ChannelConnectionView): ChannelProductScope {
  return { workspaceId, connectionId: connection.id, rule: connection.settings.productSelection };
}

/**
 * How many of the catalog's products are in each display state on one store, by the same rule
 * as the store's own product list (and its display-state filter). SQL counts every state it can decide alone; only selected
 * products off the channel, or refused, are read (in batches) and checked as the connector
 * would, and not even those when the store's own setup already blocks publishing.
 */
@Injectable()
export class StoreListingStates {
  constructor(
    private readonly products: ChannelProductsRepository,
    private readonly displays: ChannelProductDisplays,
  ) {}

  async count(workspaceId: string, connection: ChannelConnectionView): Promise<ListingStateCounts> {
    const scope = scopeOf(workspaceId, connection);
    const [settled, unsettled] = await Promise.all([
      this.countSettled(scope),
      this.countUnsettled(scope, connection),
    ]);
    return sumCounts(settled, unsettled);
  }

  /**
   * The products of `search` that need details on the store, by the same rule, and how many of
   * them the channel never refused (pending ones; the rest are failed). Only selected products
   * can need details, so only the unsettled ones are read.
   */
  async countNeedsDetails(
    workspaceId: string,
    connection: ChannelConnectionView,
    search: Prisma.ProductWhereInput,
  ): Promise<NeedsDetailsCounts> {
    const scope = scopeOf(workspaceId, connection);
    const where = { AND: [unsettledWhere(scope), search] };
    if (connection.publishReadiness.unmet.length > 0) {
      const pending = {
        AND: [channelProductStateWhere(scope, ChannelProductState.Pending), search],
      };
      const [total, unsent] = await Promise.all([
        this.products.count(where),
        this.products.count(pending),
      ]);
      return { total, unsent };
    }
    const counts: NeedsDetailsCounts = { total: 0, unsent: 0 };
    await this.scanUnsettled(connection, where, (product, state) => {
      if (state !== ListingDisplayState.NeedsDetails) return;
      counts.total += 1;
      if (!isRefused(product)) counts.unsent += 1;
    });
    return counts;
  }

  private async countSettled(scope: ChannelProductScope): Promise<ListingStateCounts> {
    const conditions = settledStateConditions(scope);
    const totals = await Promise.all(
      STATES.map(async (state) => {
        const counts = await Promise.all(
          conditions[state].map((where) => this.products.count(where)),
        );
        return [state, counts.reduce((sum, count) => sum + count, 0)] as const;
      }),
    );
    return Object.fromEntries(totals) as ListingStateCounts;
  }

  /** With the store's setup unfinished, every such product needs details: no product is read. */
  private async countUnsettled(
    scope: ChannelProductScope,
    connection: ChannelConnectionView,
  ): Promise<ListingStateCounts> {
    const where = unsettledWhere(scope);
    if (connection.publishReadiness.unmet.length > 0) {
      return {
        ...emptyCounts(),
        [ListingDisplayState.NeedsDetails]: await this.products.count(where),
      };
    }
    return this.resolveInBatches(connection, where);
  }

  private async resolveInBatches(
    connection: ChannelConnectionView,
    where: Prisma.ProductWhereInput,
  ): Promise<ListingStateCounts> {
    const counts = emptyCounts();
    await this.scanUnsettled(connection, where, (_product, state) => {
      counts[state] += 1;
    });
    return counts;
  }

  /** Reads the unsettled products of `where` in batches and resolves each one's state. */
  private async scanUnsettled(
    connection: ChannelConnectionView,
    where: Prisma.ProductWhereInput,
    visit: UnsettledVisitor,
  ): Promise<void> {
    let afterId: string | null = null;
    for (;;) {
      const batch: DisplayCandidateRecord[] = await this.products.listDisplayCandidateBatch(where, {
        afterId,
        size: SELECTION_BATCH_SIZE,
      });
      for (const record of batch) {
        const product = toDisplayedStoreProduct(record, connection.id);
        visit(product, this.stateOf(connection, product));
      }
      if (batch.length < SELECTION_BATCH_SIZE) return;
      afterId = batch[batch.length - 1]?.id ?? null;
    }
  }

  /**
   * A selected product's state, by the store list's own resolution. Every product read here is
   * selected, and selected products are never removed by hand.
   */
  private stateOf(
    connection: ChannelConnectionView,
    product: DisplayedStoreProduct,
  ): ListingDisplayState {
    const membership: StoreMembership = {
      selected: new Set([product.product.id]),
      removedByHand: new Set(),
    };
    return this.displays.resolve(connection, product, membership).state;
  }
}
