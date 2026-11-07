export const BILLING_TAG = 'Billing';
/** An organization's billing; held by the organization, opened from any of its workspaces. */
export const ORGANIZATION_BILLING_ROUTE = 'organizations/:organizationId/billing';
export const CHECKOUT_SESSIONS_PATH = 'checkout-sessions';
export const PORTAL_SESSIONS_PATH = 'portal-sessions';
/** What the organization a workspace belongs to may do under its subscription. */
export const WORKSPACE_BILLING_ACCESS_ROUTE = 'workspaces/:workspaceId/billing-access';
/** The plan lineup with prices, for pricing pages. */
export const BILLING_PLANS_ROUTE = 'billing/plans';
/** Where Stripe delivers billing events: `{API_PUBLIC_URL}/api/v1/billing/webhooks/stripe`. */
export const STRIPE_WEBHOOK_ROUTE = 'billing/webhooks/stripe';
export const STRIPE_SIGNATURE_HEADER = 'stripe-signature';
export const MISSING_WEBHOOK_BODY = 'A webhook needs a body';
/** Plan codes are short slugs, such as "growth". */
export const PLAN_CODE_MAX_LENGTH = 64;

/** Names the generated clients use for the enums of this module. */
export const BILLING_INTERVAL_SCHEMA_NAME = 'BillingInterval';

/** Route metadata: the route stays open to a read-only organization (it removes access). */
export const ALLOWED_WHILE_READ_ONLY_METADATA_KEY = 'crossmart:allowed-while-read-only';
/** Methods that only read, which a read-only organization may always use. */
export const READ_ONLY_HTTP_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * `node dist/apps/api/main.js --billing-resync --org <id> | --all` reads organizations'
 * subscriptions from the billing provider and applies them, then exits.
 */
export const BILLING_RESYNC_FLAG = 'billing-resync';
export const RESYNC_ORG_OPTION = 'org';
export const RESYNC_ALL_OPTION = 'all';
/** pnpm may pass on the `--` that separates a script's own arguments; it is not an option. */
export const ARGUMENTS_SEPARATOR = '--';
/** `process.argv` starts with the node binary and the script; the arguments follow. */
export const SCRIPT_ARGUMENTS_START = 2;
export const RESYNC_LOG_CONTEXT = 'BillingResync';
export const RESYNC_USAGE =
  'Usage: node dist/apps/api/main.js --billing-resync --org <organization id> [--org <id>...] | --all';
