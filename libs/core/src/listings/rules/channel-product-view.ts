import type { Prisma } from '@crossmart/database';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { ChannelProductView } from '../enums/channel-product-view.enum.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import type { ListingDisplay } from '../entities/listing-display.js';
import {
  type ChannelProductScope,
  channelProductStateWhere,
  OUT_OF_STORE_STATES,
} from './channel-product-state-where.js';

/**
 * The product states each view is made of. Needs attention also reads the display state (a
 * pending product needs details or not), so its states only narrow the query: see
 * `channelProductViewMatch`.
 */
const VIEW_STATES: Record<ChannelProductView, readonly ChannelProductState[] | null> = {
  [ChannelProductView.All]: null,
  [ChannelProductView.Live]: [ChannelProductState.Listed],
  [ChannelProductView.NeedsAttention]: [ChannelProductState.Failed, ChannelProductState.Pending],
  [ChannelProductView.NotListed]: [
    ChannelProductState.Pending,
    ChannelProductState.Removing,
    ChannelProductState.RemovedByHand,
    ChannelProductState.Excluded,
  ],
};

/** The products in the store: every state but those of products it does not have. */
export function inStoreWhere(scope: ChannelProductScope): Prisma.ProductWhereInput {
  return { NOT: { OR: OUT_OF_STORE_STATES.map((out) => channelProductStateWhere(scope, out)) } };
}

/** The products of `scope` a view may list; `channelProductViewMatch` decides the rest. */
export function channelProductViewWhere(
  scope: ChannelProductScope,
  view: ChannelProductView,
): Prisma.ProductWhereInput {
  const states = VIEW_STATES[view];
  if (!states) return inStoreWhere(scope);
  return { OR: states.map((state) => channelProductStateWhere(scope, state)) };
}

/**
 * Whether a product belongs in a list filtered in code: its display on the store, and whether
 * the channel refused its listing (the product is failed).
 */
export type DisplayMatch = (display: ListingDisplay, refused: boolean) => boolean;

/** Failed products, and those that need details: what the store's merchant has to fix. */
const needsAttention: DisplayMatch = (display, refused) =>
  refused || display.state === ListingDisplayState.NeedsDetails;

/** What a view keeps once each product's display is resolved, when SQL alone cannot say. */
export function channelProductViewMatch(view: ChannelProductView): DisplayMatch | null {
  return view === ChannelProductView.NeedsAttention ? needsAttention : null;
}

/** Keeps the products in `state`. */
export function displayStateMatch(state: ListingDisplayState): DisplayMatch {
  return (display) => display.state === state;
}
