import type { PublishRequirement, UnmetPublishRequirement } from '@crossmart/connectors';
import type { ListingStatus } from '@crossmart/database';
import type { ListingDisplayState } from '../enums/listing-display-state.enum.js';

/** A product's state on a store as the merchant reads it, with why when it needs them. */
export interface ListingDisplay {
  state: ListingDisplayState;
  /**
   * Short and merchant-readable, for `needs_details` and `failed`: what to add, or the channel's
   * message. Never holds secrets. Null for the other states.
   */
  reason: string | null;
}

/** The parts of a listing its display state reads. */
export interface DisplayedListing {
  status: ListingStatus;
  lastError: string | null;
  missingRequirement: PublishRequirement | null;
}

/** Everything one product's display state on one store follows from. */
export interface ListingDisplayInput {
  /** Whether the store's selection includes the product. */
  selected: boolean;
  /** Whether the merchant removed it from the store by hand. */
  removedByHand: boolean;
  listing: DisplayedListing | null;
  /** What blocks publishing it now: the store's setup first, then the product's details. */
  blockers: readonly UnmetPublishRequirement[];
}
