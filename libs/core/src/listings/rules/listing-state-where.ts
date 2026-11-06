import { ListingStatus, type Prisma } from '@crossmart/database';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import {
  type ChannelProductScope,
  channelProductStateWhere,
  ON_CHANNEL_STATUSES,
} from './channel-product-state-where.js';
import { selectionWhere } from './selection-where.js';

/** Per display state, the product conditions whose counts add up to it. */
export type SettledStateConditions = Record<ListingDisplayState, Prisma.ProductWhereInput[]>;

/** Products with a listing on the store that a sync or retry queued, held by the channel. */
function syncQueuedOnChannel(connectionId: string): Prisma.ProductWhereInput {
  return {
    listings: {
      some: {
        connectionId,
        status: { in: [...ON_CHANNEL_STATUSES] },
        syncRequestedAt: { not: null },
      },
    },
  };
}

/** Products the store took off the channel: a delisted listing remains. */
function delistedFrom(connectionId: string): Prisma.ProductWhereInput {
  return { listings: { some: { connectionId, status: ListingStatus.DELISTED } } };
}

function both(...conditions: Prisma.ProductWhereInput[]): Prisma.ProductWhereInput {
  return { AND: conditions };
}

/**
 * The products of each display state that SQL decides alone, by the same rule as
 * `listingDisplayOf`: listed products are published, or publishing while a sync updates them;
 * unselected ones are removing, removed, a draft, or failed. Each state sums its conditions.
 * Selected products off the channel, and selected failures, are left to `unsettledWhere`.
 */
export function settledStateConditions(scope: ChannelProductScope): SettledStateConditions {
  const state = (value: ChannelProductState): Prisma.ProductWhereInput =>
    channelProductStateWhere(scope, value);
  const { connectionId } = scope;
  const listed = state(ChannelProductState.Listed);
  const excluded = state(ChannelProductState.Excluded);
  return {
    [ListingDisplayState.Draft]: [both(excluded, { NOT: delistedFrom(connectionId) })],
    [ListingDisplayState.NeedsDetails]: [],
    [ListingDisplayState.Ready]: [],
    [ListingDisplayState.Publishing]: [both(listed, syncQueuedOnChannel(connectionId))],
    [ListingDisplayState.Published]: [both(listed, { NOT: syncQueuedOnChannel(connectionId) })],
    [ListingDisplayState.Failed]: [
      both(state(ChannelProductState.Failed), { NOT: selectionWhere(scope) }),
    ],
    [ListingDisplayState.Removing]: [state(ChannelProductState.Removing)],
    [ListingDisplayState.Removed]: [
      state(ChannelProductState.RemovedByHand),
      both(excluded, delistedFrom(connectionId)),
    ],
  };
}

/**
 * Selected products the channel does not hold, or refused: whether they need details, are
 * ready, or are publishing depends on what the store's connector checks about each.
 */
export function unsettledWhere(scope: ChannelProductScope): Prisma.ProductWhereInput {
  return {
    OR: [
      channelProductStateWhere(scope, ChannelProductState.Pending),
      both(channelProductStateWhere(scope, ChannelProductState.Failed), selectionWhere(scope)),
    ],
  };
}
