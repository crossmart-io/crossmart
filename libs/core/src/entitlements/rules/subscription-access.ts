import { SubscriptionStatus } from '@crossmart/database';
import { MS_PER_DAY } from '@crossmart/common';
import type {
  SubscriptionAccess,
  SubscriptionAccessTerms,
  SubscriptionStanding,
} from '../entities/subscription-access.js';
import { SubscriptionAccessState } from '../enums/subscription-access-state.enum.js';

type AccessRule = (
  standing: SubscriptionStanding,
  terms: SubscriptionAccessTerms,
  now: Date,
) => SubscriptionAccess;

/** States of a live subscription, which a scheduled cancellation can still end. */
const CANCELLABLE_STATES: ReadonlySet<SubscriptionAccessState> = new Set([
  SubscriptionAccessState.Trialing,
  SubscriptionAccessState.Active,
  SubscriptionAccessState.PastDueGrace,
]);

function fullAccess(state: SubscriptionAccessState, until: Date | null = null): SubscriptionAccess {
  return { state, writable: true, until, cancelAt: null };
}

function readOnly(state: SubscriptionAccessState): SubscriptionAccess {
  return { state, writable: false, until: null, cancelAt: null };
}

/** An organization from before billing keeps full access until the configured date, if any. */
function legacyAccess(
  { legacyAccessUntil }: SubscriptionAccessTerms,
  now: Date,
): SubscriptionAccess {
  if (legacyAccessUntil && now >= legacyAccessUntil) {
    return readOnly(SubscriptionAccessState.SubscriptionRequired);
  }
  return fullAccess(SubscriptionAccessState.Legacy, legacyAccessUntil);
}

/** Past due keeps full access for the grace period, counted from when the payment failed. */
function pastDueAccess(
  { pastDueSince }: SubscriptionStanding,
  { pastDueGraceDays }: SubscriptionAccessTerms,
  now: Date,
): SubscriptionAccess {
  const graceEnds = new Date((pastDueSince ?? now).getTime() + pastDueGraceDays * MS_PER_DAY);
  return now < graceEnds
    ? fullAccess(SubscriptionAccessState.PastDueGrace, graceEnds)
    : readOnly(SubscriptionAccessState.PastDue);
}

const ACCESS_RULES: Readonly<Record<SubscriptionStatus, AccessRule>> = {
  [SubscriptionStatus.ACTIVE]: (standing, terms, now) =>
    standing.subscribed ? fullAccess(SubscriptionAccessState.Active) : legacyAccess(terms, now),
  [SubscriptionStatus.TRIALING]: (standing) =>
    fullAccess(SubscriptionAccessState.Trialing, standing.trialEnd),
  [SubscriptionStatus.PAST_DUE]: pastDueAccess,
  [SubscriptionStatus.CANCELED]: () => readOnly(SubscriptionAccessState.Canceled),
  [SubscriptionStatus.INCOMPLETE]: () => readOnly(SubscriptionAccessState.SubscriptionRequired),
  [SubscriptionStatus.UNPAID]: () => readOnly(SubscriptionAccessState.Unpaid),
  [SubscriptionStatus.PAUSED]: () => readOnly(SubscriptionAccessState.Paused),
};

/**
 * What an organization's subscription lets it do where billing is on (ADR 0024). Trialing,
 * active, past due within the grace period, and organizations from before billing keep full
 * access; every other standing is read-only. `ACTIVE` with no provider subscription is an
 * organization from before billing, which is how the billing migration leaves every one.
 */
export function subscriptionAccess(
  standing: SubscriptionStanding,
  terms: SubscriptionAccessTerms,
  now: Date,
): SubscriptionAccess {
  const access = ACCESS_RULES[standing.status](standing, terms, now);
  return CANCELLABLE_STATES.has(access.state) ? { ...access, cancelAt: standing.cancelAt } : access;
}

/** Billing is off: nothing is restricted. */
export const UNRESTRICTED_ACCESS: SubscriptionAccess = fullAccess(
  SubscriptionAccessState.Unrestricted,
);

/** An unclaimed sandbox account, which the sandbox rules restrict instead (ADR 0019). */
export const SANDBOX_ACCESS: SubscriptionAccess = fullAccess(SubscriptionAccessState.Sandbox);
