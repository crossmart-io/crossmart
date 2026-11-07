import { SubscriptionStatus } from '@crossmart/database';
import type {
  SubscriptionAccessTerms,
  SubscriptionStanding,
} from '../entities/subscription-access.js';
import { SubscriptionAccessState } from '../enums/subscription-access-state.enum.js';
import { subscriptionAccess } from './subscription-access.js';

const NOW = new Date('2026-11-20T12:00:00.000Z');
const TERMS: SubscriptionAccessTerms = { pastDueGraceDays: 7, legacyAccessUntil: null };

function standing(overrides: Partial<SubscriptionStanding>): SubscriptionStanding {
  return {
    status: SubscriptionStatus.ACTIVE,
    subscribed: true,
    trialEnd: null,
    pastDueSince: null,
    cancelAt: null,
    ...overrides,
  };
}

describe('subscriptionAccess', () => {
  it('keeps full access while trialing, until the trial ends', () => {
    const trialEnd = new Date('2026-11-25T00:00:00.000Z');
    expect(
      subscriptionAccess(standing({ status: SubscriptionStatus.TRIALING, trialEnd }), TERMS, NOW),
    ).toEqual({
      state: SubscriptionAccessState.Trialing,
      writable: true,
      until: trialEnd,
      cancelAt: null,
    });
  });

  it('says when a scheduled cancellation ends a live subscription', () => {
    const cancelAt = new Date('2026-11-25T00:00:00.000Z');
    const scheduled = (status: SubscriptionStatus) =>
      subscriptionAccess(standing({ status, trialEnd: cancelAt, cancelAt }), TERMS, NOW);

    expect(scheduled(SubscriptionStatus.TRIALING)).toMatchObject({ until: cancelAt, cancelAt });
    expect(scheduled(SubscriptionStatus.ACTIVE)).toMatchObject({ cancelAt });
    expect(scheduled(SubscriptionStatus.CANCELED)).toMatchObject({ cancelAt: null });
  });

  it('keeps full access for a paying subscription', () => {
    expect(subscriptionAccess(standing({}), TERMS, NOW)).toEqual({
      state: SubscriptionAccessState.Active,
      writable: true,
      until: null,
      cancelAt: null,
    });
  });

  it('grandfathers an organization from before billing unless legacy access has an end', () => {
    const legacy = standing({ subscribed: false });
    expect(subscriptionAccess(legacy, TERMS, NOW)).toMatchObject({
      state: SubscriptionAccessState.Legacy,
      writable: true,
      until: null,
    });

    const until = new Date('2026-12-01T00:00:00.000Z');
    expect(subscriptionAccess(legacy, { ...TERMS, legacyAccessUntil: until }, NOW)).toEqual({
      state: SubscriptionAccessState.Legacy,
      writable: true,
      until,
      cancelAt: null,
    });
    expect(
      subscriptionAccess(legacy, { ...TERMS, legacyAccessUntil: new Date('2026-11-01') }, NOW),
    ).toMatchObject({ state: SubscriptionAccessState.SubscriptionRequired, writable: false });
  });

  it('gives a past-due subscription the grace period, then makes it read-only', () => {
    const pastDue = (since: string) =>
      subscriptionAccess(
        standing({ status: SubscriptionStatus.PAST_DUE, pastDueSince: new Date(since) }),
        TERMS,
        NOW,
      );

    expect(pastDue('2026-11-18T12:00:00.000Z')).toEqual({
      state: SubscriptionAccessState.PastDueGrace,
      writable: true,
      until: new Date('2026-11-25T12:00:00.000Z'),
      cancelAt: null,
    });
    expect(pastDue('2026-11-10T12:00:00.000Z')).toMatchObject({
      state: SubscriptionAccessState.PastDue,
      writable: false,
    });
  });

  it.each([
    [SubscriptionStatus.CANCELED, SubscriptionAccessState.Canceled],
    [SubscriptionStatus.UNPAID, SubscriptionAccessState.Unpaid],
    [SubscriptionStatus.PAUSED, SubscriptionAccessState.Paused],
    [SubscriptionStatus.INCOMPLETE, SubscriptionAccessState.SubscriptionRequired],
  ])('makes %s read-only', (status, state) => {
    expect(subscriptionAccess(standing({ status }), TERMS, NOW)).toEqual({
      state,
      writable: false,
      until: null,
      cancelAt: null,
    });
  });
});
