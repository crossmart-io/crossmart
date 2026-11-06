import type { Prisma } from '@crossmart/database';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import {
  type ChannelProductScope,
  channelProductStateWhere,
} from './channel-product-state-where.js';

/**
 * The product states each display state can come from. A display state also reads what blocks
 * publishing (the store's setup and the connector's checks of the product), which only code can
 * tell, so these narrow a query to the products that may have it; the rest is decided in code.
 */
const DISPLAY_STATE_SOURCES: Record<ListingDisplayState, readonly ChannelProductState[]> = {
  [ListingDisplayState.Draft]: [ChannelProductState.Excluded],
  [ListingDisplayState.NeedsDetails]: [ChannelProductState.Pending, ChannelProductState.Failed],
  [ListingDisplayState.Ready]: [ChannelProductState.Pending],
  [ListingDisplayState.Publishing]: [
    ChannelProductState.Listed,
    ChannelProductState.Pending,
    ChannelProductState.Failed,
  ],
  [ListingDisplayState.Published]: [ChannelProductState.Listed],
  [ListingDisplayState.Failed]: [ChannelProductState.Failed],
  [ListingDisplayState.Removing]: [ChannelProductState.Removing],
  [ListingDisplayState.Removed]: [ChannelProductState.RemovedByHand, ChannelProductState.Excluded],
};

/** The product states a display state can come from. */
export function displayStateSources(state: ListingDisplayState): readonly ChannelProductState[] {
  return DISPLAY_STATE_SOURCES[state];
}

/** The products of `scope` that may show `state`: those in one of the states it comes from. */
export function displayStateWhere(
  scope: ChannelProductScope,
  state: ListingDisplayState,
): Prisma.ProductWhereInput {
  return {
    OR: DISPLAY_STATE_SOURCES[state].map((source) => channelProductStateWhere(scope, source)),
  };
}
