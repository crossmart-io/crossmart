/** The prices each plan sells at, in minor units (cents), by plan code and interval (ADR 0020). */
export const PLAN_PRICES_FILE = new URL('./plan-prices.json', import.meta.url);
/** Lets the sync write to a live Stripe account; without it only test keys are accepted. */
export const LIVE_FLAG = '--live';
/** Stripe test-mode secret and restricted keys. */
export const TEST_KEY_PREFIXES = ['sk_test_', 'rk_test_'] as const;

/** Each plan's Stripe product has a fixed id, so the sync finds it again. */
export const PRODUCT_ID_PREFIX = 'crossmart_plan_';
export const PRODUCT_NAME_PREFIX = 'Crossmart ';
/** Marks the Customer Portal configuration the sync manages. */
export const MANAGED_METADATA_KEY = 'crossmart_managed';
export const MANAGED_METADATA_VALUE = 'true';
/** Stripe's error code for an object that does not exist. */
export const RESOURCE_MISSING = 'resource_missing';
/** Portal configurations are few; one page holds them all. */
export const PORTAL_CONFIGURATIONS_PAGE_SIZE = 100;

export const NOT_TEST_KEY =
  'STRIPE_SECRET_KEY is not a test-mode key. Run with --live to change a live Stripe account.';
export const MISSING_STRIPE_KEY =
  'Set STRIPE_SECRET_KEY (a test-mode key) to sync plans to Stripe.';
export const MISSING_DATABASE_URL = 'Set DATABASE_URL: the plans are read from the database.';
