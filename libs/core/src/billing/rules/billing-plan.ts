import { BillingInterval } from '@crossmart/database';
import type { OfferedPlan } from '../../entitlements/entities/offered-plan.js';
import { BILLING_INTERVALS, MONTHS_PER_YEAR } from '../billing.constants.js';
import type { BillingPlan, PlanPrice } from '../entities/billing-plan.js';
import type { ProviderPrice } from '../entities/provider-price.js';
import { priceLookupKey } from './price-lookup-key.js';

const MONTHS_COVERED: Readonly<Record<BillingInterval, number>> = {
  [BillingInterval.MONTHLY]: 1,
  [BillingInterval.ANNUAL]: MONTHS_PER_YEAR,
};

function toPlanPrice(price: ProviderPrice): PlanPrice {
  return {
    interval: price.interval,
    amount: price.amount,
    monthlyAmount: Math.round(price.amount / MONTHS_COVERED[price.interval]),
    currency: price.currency,
  };
}

/** Every lookup key the offered plans may have a price under. */
export function planLookupKeys(plans: readonly OfferedPlan[]): string[] {
  return plans.flatMap((plan) =>
    BILLING_INTERVALS.map((interval) => priceLookupKey(plan.code, interval)),
  );
}

/**
 * An offered plan with the prices the provider has for it, monthly first. A plan without any
 * (Enterprise, or every plan where billing is off) is not self-serve.
 */
export function toBillingPlan(
  plan: OfferedPlan,
  prices: ReadonlyMap<string, ProviderPrice>,
): BillingPlan {
  const planPrices = BILLING_INTERVALS.flatMap((interval) => {
    const price = prices.get(priceLookupKey(plan.code, interval));
    return price ? [toPlanPrice(price)] : [];
  });
  return { ...plan, prices: planPrices, selfServe: planPrices.length > 0 };
}
