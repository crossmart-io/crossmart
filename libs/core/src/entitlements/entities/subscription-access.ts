import type { SubscriptionStatus } from '@crossmart/database';
import type { SubscriptionAccessState } from '../enums/subscription-access-state.enum.js';

/** Whether an organization may change anything under its subscription, and until when. */
export interface SubscriptionAccess {
  state: SubscriptionAccessState;
  /** False when the organization is read-only, once billing is enforced. */
  writable: boolean;
  /** When the state ends on its own (a trial, a grace period, legacy access); null if never. */
  until: Date | null;
}

/** What the access rules read of a subscription. */
export interface SubscriptionStanding {
  status: SubscriptionStatus;
  /** Whether the organization ever checked out: the provider holds a subscription for it. */
  subscribed: boolean;
  trialEnd: Date | null;
  pastDueSince: Date | null;
}

/** The instance's billing terms the access rules apply. */
export interface SubscriptionAccessTerms {
  pastDueGraceDays: number;
  /** Until when organizations from before billing keep full access; null is for good. */
  legacyAccessUntil: Date | null;
}
