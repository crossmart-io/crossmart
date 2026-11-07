import { SubscriptionStatus } from '@crossmart/database';
import type { BillingAccountRecord } from '../repositories/billing-account.repository.js';

/** Statuses of a provider subscription that never started or is over. */
const ENDED_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  SubscriptionStatus.CANCELED,
  SubscriptionStatus.INCOMPLETE,
]);

type BillingStanding = Pick<BillingAccountRecord, 'status' | 'externalSubscriptionId' | 'trialEnd'>;

/**
 * Whether the organization holds a provider subscription that has not ended. Changing its plan or
 * interval then goes through the billing portal, not a second checkout.
 */
export function hasLiveSubscription(account: BillingStanding): boolean {
  return account.externalSubscriptionId !== null && !ENDED_STATUSES.has(account.status);
}

/** Whether a provider subscription with this status still counts, so an older one cannot undo it. */
export function isLiveStatus(status: SubscriptionStatus): boolean {
  return !ENDED_STATUSES.has(status);
}

/** A trial is for an organization's first subscription only. */
export function isTrialAvailable(account: BillingStanding): boolean {
  return account.trialEnd === null && account.externalSubscriptionId === null;
}
