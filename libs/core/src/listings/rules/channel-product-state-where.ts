import { ListingStatus, type Prisma } from '@crossmart/database';
import { ChannelProductState } from '../enums/channel-product-state.enum.js';
import { type SelectionScope, selectionWhere } from './selection-where.js';

/** Listing statuses of a product the channel holds. */
export const ON_CHANNEL_STATUSES: readonly ListingStatus[] = [
  ListingStatus.ACTIVE,
  ListingStatus.INACTIVE,
];

/** The connection whose products are sorted into states: its store and its selection. */
export type ChannelProductScope = SelectionScope;

function listingsWith(
  connectionId: string,
  statuses: readonly ListingStatus[],
): Prisma.ProductWhereInput {
  return { listings: { some: { connectionId, status: { in: [...statuses] } } } };
}

/** Products whose state is decided by their listing alone, before the selection is asked. */
function listingCondition(
  connectionId: string,
  state: ChannelProductState,
): Prisma.ProductWhereInput {
  const failed = listingsWith(connectionId, [ListingStatus.ERROR]);
  if (state === ChannelProductState.Failed) return failed;
  const onChannel = listingsWith(connectionId, ON_CHANNEL_STATUSES);
  const isOnChannel =
    state === ChannelProductState.Listed || state === ChannelProductState.Removing;
  return { AND: [{ NOT: failed }, isOnChannel ? onChannel : { NOT: onChannel }] };
}

/** Whether a state is one of products the selection includes, or of those it leaves out. */
const SELECTED_STATES: ReadonlySet<ChannelProductState> = new Set([
  ChannelProductState.Listed,
  ChannelProductState.Pending,
]);

/** Products off the channel and unselected split by whether the merchant removed them by hand. */
function handRemovalCondition(
  scope: ChannelProductScope,
  state: ChannelProductState,
): Prisma.ProductWhereInput {
  const removed = { id: { in: scope.rule?.excludeProductIds ?? [] } };
  if (state === ChannelProductState.RemovedByHand) return removed;
  return state === ChannelProductState.Excluded ? { NOT: removed } : {};
}

/**
 * The products of `scope` in `state`. The states split the catalog: a failed listing wins, then
 * selected or not, crossed with on the channel or not; unselected products off the channel are
 * removed by hand or merely excluded.
 */
export function channelProductStateWhere(
  scope: ChannelProductScope,
  state: ChannelProductState,
): Prisma.ProductWhereInput {
  const { workspaceId, connectionId } = scope;
  const listing = listingCondition(connectionId, state);
  if (state === ChannelProductState.Failed) {
    return { workspaceId, ...listing };
  }
  const selected = selectionWhere(scope);
  return {
    workspaceId,
    AND: [
      listing,
      SELECTED_STATES.has(state) ? selected : { NOT: selected },
      handRemovalCondition(scope, state),
    ],
  };
}

/** States of products that are not in the store: lists of the store's products leave them out. */
export const OUT_OF_STORE_STATES: readonly ChannelProductState[] = [
  ChannelProductState.RemovedByHand,
  ChannelProductState.Excluded,
];

interface ListingWithStatus {
  status: ListingStatus;
}

/** The state of one product, from whether it is selected and the statuses of its listings. */
export function channelProductStateOf(
  selected: boolean,
  listings: readonly ListingWithStatus[],
  removedByHand = false,
): ChannelProductState {
  if (listings.some((listing) => listing.status === ListingStatus.ERROR)) {
    return ChannelProductState.Failed;
  }
  const onChannel = listings.some((listing) => ON_CHANNEL_STATUSES.includes(listing.status));
  if (selected) return onChannel ? ChannelProductState.Listed : ChannelProductState.Pending;
  if (onChannel) return ChannelProductState.Removing;
  return removedByHand ? ChannelProductState.RemovedByHand : ChannelProductState.Excluded;
}

/** The listing a row shows: a failed one first, then one on the channel, else the latest. */
export function shownListing<TListing extends ListingWithStatus>(
  listings: readonly TListing[],
): TListing | null {
  return (
    listings.find((listing) => listing.status === ListingStatus.ERROR) ??
    listings.find((listing) => ON_CHANNEL_STATUSES.includes(listing.status)) ??
    listings[0] ??
    null
  );
}
