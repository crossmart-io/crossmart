import type Stripe from 'stripe';
import { type BillingInterval, SubscriptionStatus } from '@crossmart/database';
import { ORGANIZATION_ID_METADATA_KEY } from '../../billing.constants.js';
import type { ProviderPrice } from '../../entities/provider-price.js';
import type { ProviderSubscription } from '../../entities/provider-subscription.js';
import { UnknownSubscriptionStatusError } from '../../errors/billing.errors.js';
import { parsePriceLookupKey } from '../../rules/price-lookup-key.js';
import {
  MS_PER_SECOND,
  STRIPE_INTERVALS,
  STRIPE_SUBSCRIPTION_STATUSES,
} from './stripe.constants.js';

/** The id of a Stripe reference, whether it came expanded or as an id. */
export function stripeId(reference: string | { id: string } | null | undefined): string | null {
  if (!reference) return null;
  return typeof reference === 'string' ? reference : reference.id;
}

function fromUnixSeconds(seconds: number | null | undefined): Date | null {
  return seconds ? new Date(seconds * MS_PER_SECOND) : null;
}

function statusOf(subscription: Stripe.Subscription): SubscriptionStatus {
  const status = STRIPE_SUBSCRIPTION_STATUSES[subscription.status];
  if (!status) throw new UnknownSubscriptionStatusError(subscription.status);
  return status;
}

function intervalOf(price: Stripe.Price): BillingInterval | null {
  return price.recurring ? (STRIPE_INTERVALS[price.recurring.interval] ?? null) : null;
}

/** The item billing the plan: the one whose price's lookup key names a plan. */
function planItemOf(subscription: Stripe.Subscription): Stripe.SubscriptionItem | null {
  const items = subscription.items.data;
  return items.find((item) => parsePriceLookupKey(item.price.lookup_key ?? '')) ?? null;
}

/** The latest end of the items' periods: since API 2025-03-31, periods live on the items. */
function currentPeriodEndOf(subscription: Stripe.Subscription): Date | null {
  const ends = subscription.items.data.map((item) => item.current_period_end);
  return ends.length > 0 ? fromUnixSeconds(Math.max(...ends)) : null;
}

/**
 * When a scheduled cancellation takes effect; null when the subscription renews, or has already
 * ended. The Customer Portal sets `cancel_at` (the trial or period end) and leaves
 * `cancel_at_period_end` false, so both are read. Without `cancel_at`, the period end applies, or
 * the trial end while trialing.
 */
function cancelAtOf(
  subscription: Stripe.Subscription,
  status: SubscriptionStatus,
  currentPeriodEnd: Date | null,
): Date | null {
  if (status === SubscriptionStatus.CANCELED) return null;
  const cancelAt = fromUnixSeconds(subscription.cancel_at);
  if (cancelAt || !subscription.cancel_at_period_end) return cancelAt;
  const trialEnd = fromUnixSeconds(subscription.trial_end);
  return status === SubscriptionStatus.TRIALING && trialEnd ? trialEnd : currentPeriodEnd;
}

/** A Stripe subscription in Crossmart's terms. Throws on a status Crossmart does not know. */
export function toProviderSubscription(subscription: Stripe.Subscription): ProviderSubscription {
  const planItem = planItemOf(subscription);
  const status = statusOf(subscription);
  const currentPeriodEnd = currentPeriodEndOf(subscription);
  const cancelAt = cancelAtOf(subscription, status, currentPeriodEnd);
  return {
    id: subscription.id,
    customerId: stripeId(subscription.customer) ?? '',
    organizationId: subscription.metadata[ORGANIZATION_ID_METADATA_KEY] ?? null,
    status,
    priceLookupKeys: subscription.items.data.flatMap((item) =>
      item.price.lookup_key ? [item.price.lookup_key] : [],
    ),
    interval: planItem ? intervalOf(planItem.price) : null,
    currentPeriodEnd,
    trialEnd: fromUnixSeconds(subscription.trial_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || cancelAt !== null,
    cancelAt,
  };
}

/** A recurring Stripe price with a lookup key, in Crossmart's terms; others are left out. */
export function toProviderPrices(price: Stripe.Price): ProviderPrice[] {
  const interval = intervalOf(price);
  if (!price.lookup_key || price.unit_amount === null || !interval) return [];
  return [
    {
      id: price.id,
      lookupKey: price.lookup_key,
      amount: price.unit_amount,
      currency: price.currency,
      interval,
    },
  ];
}
