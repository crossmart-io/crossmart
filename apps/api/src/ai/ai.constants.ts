export const AI_TAG = 'AI';
export const AI_ROUTE = 'workspaces/:workspaceId/ai';
export const AI_STATUS_PATH = 'status';
export const AI_USAGE_PATH = 'usage';
export const CONTENT_GENERATIONS_PATH = 'content-generations';
export const CONTENT_DRAFTS_PATH = 'content-drafts';

/** Schema names the generated web client uses for the AI enums. */
export const AI_FEATURE_SCHEMA_NAME = 'AiFeature';
export const CONTENT_FIELD_SCHEMA_NAME = 'ContentField';

/**
 * Rate limits of the AI routes, per workspace and caller, so a script or a stuck client cannot
 * run up the AI bill. Drafts are interactive (one per editor action); a generation queues one
 * AI call per product, so it is limited more.
 */
export const AI_THROTTLE_WINDOW_MS = 60_000;
export const CONTENT_DRAFTS_PER_WINDOW = 30;
export const CONTENT_GENERATIONS_PER_WINDOW = 10;
export const AI_RATE_LIMITED_MESSAGE =
  'Too many AI requests from you in this workspace. Wait a minute and try again.';
