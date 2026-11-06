import type { UnmetPublishRequirement } from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import type {
  DisplayedListing,
  ListingDisplay,
  ListingDisplayInput,
} from '../entities/listing-display.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { ON_CHANNEL_STATUSES } from './channel-product-state-where.js';

function display(state: ListingDisplayState, reason: string | null = null): ListingDisplay {
  return { state, reason };
}

function needsDetails(blocker: UnmetPublishRequirement): ListingDisplay {
  return display(ListingDisplayState.NeedsDetails, blocker.reason);
}

/**
 * A refused listing needs details when the channel named what it lacks, or when publishing is
 * blocked now anyway; otherwise it failed, with the channel's message.
 */
function refusedDisplay(input: ListingDisplayInput, listing: DisplayedListing): ListingDisplay {
  const failed = display(ListingDisplayState.Failed, listing.lastError);
  if (!input.selected) return failed;
  if (listing.missingRequirement) {
    return display(ListingDisplayState.NeedsDetails, listing.lastError);
  }
  const [blocker] = input.blockers;
  return blocker ? needsDetails(blocker) : failed;
}

/** A selected product the channel does not hold yet. */
function unsentDisplay(input: ListingDisplayInput): ListingDisplay {
  const [blocker] = input.blockers;
  if (blocker) return needsDetails(blocker);
  const queued = input.listing?.status === ListingStatus.PENDING;
  return display(queued ? ListingDisplayState.Publishing : ListingDisplayState.Ready);
}

function wasRemoved({ removedByHand, listing }: ListingDisplayInput): boolean {
  return removedByHand || listing?.status === ListingStatus.DELISTED;
}

/**
 * The one state a merchant sees for a product on a store. A refused listing comes first, then
 * one the channel holds (published, or removing once it is no longer selected). A product off
 * the channel is a draft or removed when unselected, and otherwise needs details, is ready, or
 * is publishing.
 */
export function listingDisplayOf(input: ListingDisplayInput): ListingDisplay {
  const { listing } = input;
  if (listing?.status === ListingStatus.ERROR) return refusedDisplay(input, listing);
  if (listing && ON_CHANNEL_STATUSES.includes(listing.status)) {
    return display(input.selected ? ListingDisplayState.Published : ListingDisplayState.Removing);
  }
  if (!input.selected) {
    return display(wasRemoved(input) ? ListingDisplayState.Removed : ListingDisplayState.Draft);
  }
  return unsentDisplay(input);
}
