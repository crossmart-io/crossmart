export const SANDBOX_TAG = 'Sandbox accounts';
/** Where an AI agent opens a sandbox account for someone without one (ADR 0019). */
export const SANDBOX_ACCOUNTS_ROUTE = 'sandbox-accounts';
/** Routes for the person holding a claim link. */
export const SANDBOX_CLAIMS_ROUTE = 'sandbox-claims';
export const SANDBOX_CLAIM_PREVIEW_ROUTE = 'preview';
/** The signed-in owner claims from the app, without the link. */
export const WORKSPACE_SANDBOX_CLAIM_ROUTE = 'workspaces/:workspaceId/sandbox/claim';

/** Sandbox accounts one caller (by IP address) may open, per hour and per day (ADR 0019). */
export const SANDBOX_ACCOUNTS_PER_HOUR = 5;
export const SANDBOX_ACCOUNTS_PER_DAY = 50;
export const SANDBOX_HOUR_WINDOW_MS = 60 * 60 * 1000;
export const SANDBOX_DAY_WINDOW_MS = 24 * SANDBOX_HOUR_WINDOW_MS;
/** The throttler named `default` sends a plain `Retry-After`; others add their name to it. */
export const SANDBOX_HOUR_THROTTLER = 'default';
export const SANDBOX_DAY_THROTTLER = 'sandbox-day';
/** Keeps these windows apart from any other limit on the same address. */
export const SANDBOX_TRACKER_KIND = 'sandbox-ip';
export const SANDBOX_RATE_LIMITED_MESSAGE =
  'Too many sandbox accounts opened from here. Ask the user to sign up at https://app.crossmart.io, or try again later.';

/** RFC 5321's limit on an address. */
export const EMAIL_MAX_LENGTH = 254;
/** Claim tokens are 32 random bytes in base64url; anything far longer is not one. */
export const CLAIM_TOKEN_MAX_LENGTH = 128;
/** Better Auth's own ceiling on a password, so a claim takes what sign-in takes. */
export const PASSWORD_MAX_LENGTH = 128;

/** Schema names the generated clients use for this module's enums. */
export const SANDBOX_OPENING_OUTCOME_SCHEMA_NAME = 'SandboxOpeningOutcome';

/** What the agent should do next, by outcome. */
export const SANDBOX_CREATED_NEXT_STEP =
  'The account is a sandbox until the user claims it from the email Crossmart sent them. Use ' +
  'apiKey as "Authorization: Bearer <apiKey>" (or "x-api-key") with the REST API or the MCP ' +
  'server to build the catalog, stock and drafts. Connecting stores, publishing and inviting ' +
  'people wait for the claim; tell the user to open the email.';
export const SANDBOX_SIGN_IN_NEXT_STEP =
  'No account was opened and no email was sent. Ask the user to sign in to Crossmart (or sign ' +
  'up at https://app.crossmart.io) and connect you through OAuth at ' +
  'https://mcp.crossmart.io/mcp, or to give you an API key from Settings.';
