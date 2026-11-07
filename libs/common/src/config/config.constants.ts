export const DEFAULT_API_PORT = 3000;
export const MIN_PORT = 1;
export const MAX_PORT = 65535;

export const CORS_ORIGINS_SEPARATOR = ',';
export const MIN_AUTH_SECRET_LENGTH = 32;

export const DEFAULT_STORAGE_LOCAL_DIR = 'storage';
export const DEFAULT_MEDIA_PUBLIC_URL = 'http://localhost:3000/media';

export const DEFAULT_WEB_APP_URL = 'http://localhost:5173';
/** The local MCP server's address, which agent access tokens are issued for. */
export const DEFAULT_MCP_PUBLIC_URL = 'http://localhost:3100/mcp';
export const DEFAULT_MASTER_KEY_VERSION = 1;
export const MIN_MASTER_KEY_VERSION = 1;

/** How a boolean environment variable reads as true; anything else is false. */
export const ENV_TRUE = 'true';
/** Plan limits are reported but not enforced until billing exists. */
export const DEFAULT_ENTITLEMENTS_ENFORCED = false;
/** Webhook endpoints must be public https URLs unless a self-hosted instance opts out. */
export const DEFAULT_WEBHOOK_ALLOW_PRIVATE_URLS = false;
/** The model the AI agents use unless `AI_MODEL` names another. */
export const DEFAULT_AI_MODEL = 'claude-sonnet-5-5';
/** The model Agent Worker's tool loop uses unless `AGENT_WORKER_MODEL` names another. */
export const DEFAULT_AGENT_WORKER_MODEL = 'claude-sonnet-5-5';
/**
 * Ask Crossmart's questions answered per UTC day across the platform, whoever asks. Crossmart
 * pays for these calls, so the cap bounds the bill whatever the traffic; 0 turns Ask off.
 */
export const DEFAULT_ASK_DAILY_QUESTION_CAP = 1000;
/** Where Ask Crossmart sends people it cannot answer. */
export const DEFAULT_ASK_SUPPORT_EMAIL = 'hello@crossmart.io';
/** Who is emailed when a conversation with Ask Crossmart is escalated to a person. */
export const DEFAULT_ASK_ESCALATION_EMAIL = 'hello@crossmart.io';
/** Separates the addresses in `PLATFORM_ADMIN_EMAILS`. */
export const PLATFORM_ADMIN_EMAILS_SEPARATOR = ',';
/** eBay's rule for the account deletion endpoint's verification token. */
export const EBAY_VERIFICATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,80}$/;
/** Stripe Tax needs setting up in the Stripe dashboard first, so checkout leaves tax off by default. */
export const DEFAULT_STRIPE_AUTOMATIC_TAX = false;
/** Days of the trial a first checkout starts, with the card collected up front. */
export const DEFAULT_BILLING_TRIAL_DAYS = 7;
/** Days a past-due organization keeps full access while the provider retries the payment. */
export const DEFAULT_BILLING_PAST_DUE_GRACE_DAYS = 7;
/** Where plans with no self-serve price (Enterprise) send people. */
export const DEFAULT_BILLING_SALES_EMAIL = 'hello@crossmart.io';
