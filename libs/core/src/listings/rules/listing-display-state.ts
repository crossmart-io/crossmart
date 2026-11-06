import type { PublishRequirement, UnmetPublishRequirement } from '@crossmart/connectors';
import { ListingStatus } from '@crossmart/database';
import type {
  DisplayedListing,
  ListingDisplay,
  ListingDisplayInput,
} from '../entities/listing-display.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { ON_CHANNEL_STATUSES } from './channel-product-state-where.js';

function display(state: ListingDisplayState, reason: string | null = null): ListingDisplay {
  return { state, reason, requirement: null };
}

function needsDetails(requirement: PublishRequirement, reason: string | null): ListingDisplay {
  return { state: ListingDisplayState.NeedsDetails, reason, requirement };
}

function blockedBy(blocker: UnmetPublishRequirement): ListingDisplay {
  return needsDetails(blocker.requirement, blocker.reason);
}

/** Whether a sync or retry queued the listing's job, and it has not finished yet. */
function isSyncQueued(listing: DisplayedListing | null): boolean {
  return Boolean(listing?.syncRequestedAt);
}

/**
 * A refused listing needs details when the channel named what it lacks, or when publishing is
 * blocked now anyway; it is publishing again once a sync or retry queued it; otherwise it failed,
 * with the channel's message.
 */
function refusedDisplay(input: ListingDisplayInput, listing: DisplayedListing): ListingDisplay {
  const failed = display(ListingDisplayState.Failed, listing.lastError);
  if (!input.selected) return failed;
  if (listing.missingRequirement) {
    return needsDetails(listing.missingRequirement, listing.lastError);
  }
  const [blocker] = input.blockers;
  if (blocker) return blockedBy(blocker);
  return isSyncQueued(listing) ? display(ListingDisplayState.Publishing) : failed;
}

/** A selected product the channel does not hold yet. */
function unsentDisplay(input: ListingDisplayInput): ListingDisplay {
  const [blocker] = input.blockers;
  if (blocker) return blockedBy(blocker);
  const queued = input.listing?.status === ListingStatus.PENDING || isSyncQueued(input.listing);
  return display(queued ? ListingDisplayState.Publishing : ListingDisplayState.Ready);
}

/** A listing the channel holds: published, publishing again while a sync updates it, or removing. */
function heldDisplay(input: ListingDisplayInput): ListingDisplay {
  if (!input.selected) return display(ListingDisplayState.Removing);
  return display(
    isSyncQueued(input.listing) ? ListingDisplayState.Publishing : ListingDisplayState.Published,
  );
}

function wasRemoved({ removedByHand, listing }: ListingDisplayInput): boolean {
  return removedByHand || listing?.status === ListingStatus.DELISTED;
}

/**
 * The one state a merchant sees for a product on a store. A refused listing comes first, then
 * one the channel holds (published, publishing while a sync updates it, or removing once it is
 * no longer selected). A product off the channel is a draft or removed when unselected, and
 * otherwise needs details, is ready, or is publishing.
 */
export function listingDisplayOf(input: ListingDisplayInput): ListingDisplay {
  const { listing } = input;
  if (listing?.status === ListingStatus.ERROR) return refusedDisplay(input, listing);
  if (listing && ON_CHANNEL_STATUSES.includes(listing.status)) return heldDisplay(input);
  if (!input.selected) {
    return display(wasRemoved(input) ? ListingDisplayState.Removed : ListingDisplayState.Draft);
  }
  return unsentDisplay(input);
}
