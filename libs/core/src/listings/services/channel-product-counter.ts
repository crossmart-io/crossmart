import { Injectable } from '@nestjs/common';
import type { Prisma } from '@crossmart/database';
import type { ChannelProductCounts } from '../entities/channel-product.js';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ChannelProductsRepository } from '../repositories/channel-products.repository.js';
import {
  type ChannelProductScope,
  channelProductStateWhere,
} from '../rules/channel-product-state-where.js';
import type { DisplayFilterTarget } from './channel-product-displays.js';
import { StoreListingStates } from './store-listing-states.js';

const STATES = Object.values(ChannelProductState);

type StateCounts = Record<ChannelProductState, number>;

/**
 * The counts that label a store's product list: products per state, and those that need
 * details or attention. They follow the list's search but not its filters.
 */
@Injectable()
export class ChannelProductCounter {
  constructor(
    private readonly products: ChannelProductsRepository,
    private readonly listingStates: StoreListingStates,
  ) {}

  /**
   * Counts per state, and the products that need details or attention. Needs attention counts
   * each failed product once, whether or not it also needs details.
   */
  async count(
    { scope, connection }: DisplayFilterTarget,
    search: Prisma.ProductWhereInput,
  ): Promise<ChannelProductCounts> {
    const [states, needsDetails] = await Promise.all([
      this.countStates(scope, search),
      this.listingStates.countNeedsDetails(scope.workspaceId, connection, search),
    ]);
    return {
      ...states,
      needsDetails: needsDetails.total,
      needsAttention: states[ChannelProductState.Failed] + needsDetails.unsent,
    };
  }

  private async countStates(
    scope: ChannelProductScope,
    search: Prisma.ProductWhereInput,
  ): Promise<StateCounts> {
    const totals = await Promise.all(
      STATES.map((state) =>
        this.products.count({ AND: [channelProductStateWhere(scope, state), search] }),
      ),
    );
    return Object.fromEntries(
      STATES.map((state, index) => [state, totals[index] ?? 0]),
    ) as StateCounts;
  }
}
