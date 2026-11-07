import { BillingInterval } from '@crossmart/database';
import {
  INTERVAL_LOOKUP_NAMES,
  PRICE_LOOKUP_KEY_PREFIX,
  PRICE_LOOKUP_KEY_SEPARATOR,
} from '../billing.constants.js';

/** A plan's price as a lookup key names it. */
export interface PlanPriceKey {
  planCode: string;
  interval: BillingInterval;
}

const PREFIX = `${PRICE_LOOKUP_KEY_PREFIX}${PRICE_LOOKUP_KEY_SEPARATOR}`;

/** `crossmart_starter_monthly` for the Starter plan billed monthly. */
export function priceLookupKey(planCode: string, interval: BillingInterval): string {
  return [PRICE_LOOKUP_KEY_PREFIX, planCode, INTERVAL_LOOKUP_NAMES[interval]].join(
    PRICE_LOOKUP_KEY_SEPARATOR,
  );
}

function intervalNamed(name: string): BillingInterval | null {
  const match = Object.values(BillingInterval).find(
    (interval) => INTERVAL_LOOKUP_NAMES[interval] === name,
  );
  return match ?? null;
}

/**
 * The plan and interval a lookup key names, or null for any other key, such as an add-on's
 * (`crossmart_addon_listings_monthly` names no plan Crossmart offers, and is left to the caller).
 */
export function parsePriceLookupKey(lookupKey: string): PlanPriceKey | null {
  if (!lookupKey.startsWith(PREFIX)) return null;
  const rest = lookupKey.slice(PREFIX.length);
  const split = rest.lastIndexOf(PRICE_LOOKUP_KEY_SEPARATOR);
  if (split <= 0) return null;
  const interval = intervalNamed(rest.slice(split + PRICE_LOOKUP_KEY_SEPARATOR.length));
  return interval ? { planCode: rest.slice(0, split), interval } : null;
}
