import type { BillingInterval } from '@crossmart/database';
import type { OfferedPlan } from '../../entitlements/entities/offered-plan.js';

/** What a plan costs for one interval. */
export interface PlanPrice {
  interval: BillingInterval;
  /** What each charge is, in the currency's minor unit (cents). */
  amount: number;
  /** The amount spread over the months it covers, for comparing intervals. */
  monthlyAmount: number;
  currency: string;
}

/**
 * An offered plan with its prices. A plan without prices, such as Enterprise, cannot be bought
 * online: `selfServe` is false and people contact sales.
 */
export interface BillingPlan extends OfferedPlan {
  prices: PlanPrice[];
  selfServe: boolean;
}

/** The plan lineup with where to ask about plans that are not sold online. */
export interface BillingPlanCatalog {
  plans: BillingPlan[];
  salesEmail: string;
}
