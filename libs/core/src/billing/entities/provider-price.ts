import type { BillingInterval } from '@crossmart/database';

/** A recurring price at the billing provider, found by its lookup key. */
export interface ProviderPrice {
  /** The provider's id, which checkout is started with. */
  id: string;
  lookupKey: string;
  /** In the currency's minor unit (cents). */
  amount: number;
  /** Lower-case ISO 4217 code, as providers send it ("usd"). */
  currency: string;
  interval: BillingInterval;
}
