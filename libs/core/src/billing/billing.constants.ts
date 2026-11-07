import { BillingInterval } from '@crossmart/database';

/**
 * Prices are found at the billing provider by lookup key (ADR 0024):
 * `crossmart_<plan code>_<interval>`, such as `crossmart_starter_monthly`.
 */
export const PRICE_LOOKUP_KEY_PREFIX = 'crossmart';
export const PRICE_LOOKUP_KEY_SEPARATOR = '_';
/** How each interval reads in a lookup key. */
export const INTERVAL_LOOKUP_NAMES: Readonly<Record<BillingInterval, string>> = {
  [BillingInterval.MONTHLY]: 'monthly',
  [BillingInterval.ANNUAL]: 'annual',
};
/** Every interval, in the order pricing pages show them. */
export const BILLING_INTERVALS: readonly BillingInterval[] = [
  BillingInterval.MONTHLY,
  BillingInterval.ANNUAL,
];
/** Months an annual price covers, to show it per month. */
export const MONTHS_PER_YEAR = 12;

/** Metadata keys Crossmart sets on the provider's objects, to find the organization again. */
export const ORGANIZATION_ID_METADATA_KEY = 'organization_id';
export const PLAN_CODE_METADATA_KEY = 'plan_code';

/** How long plan prices read from the provider are reused before they are read again. */
export const PRICE_CACHE_TTL_MS = 10 * 60 * 1000;

/** Web app pages the provider's hosted pages send people back to, relative to `WEB_APP_URL`. */
export const BILLING_WEB_PAGES = {
  settings: '/settings/billing',
  checkoutSuccess: '/settings/billing/checkout/success',
  checkoutCanceled: '/settings/billing/checkout/canceled',
} as const;

export const BILLING_NOT_ENABLED = 'Billing is not enabled on this Crossmart instance.';
export const ALREADY_SUBSCRIBED =
  'The organization already has a subscription. Change the plan or interval from the billing ' +
  'portal (Manage billing).';
export const NO_BILLING_ACCOUNT =
  'The organization has no billing account yet. Choose a plan first.';
export const PLAN_NOT_SELF_SERVE =
  'This plan cannot be bought online. Contact sales to subscribe to it.';
export const INVALID_WEBHOOK_SIGNATURE = 'The webhook signature is missing or invalid.';
export const UNKNOWN_PLAN = 'No plan with this code is offered.';
