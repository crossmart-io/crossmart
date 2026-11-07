export const ASK_TAG = 'Ask Crossmart';
export const ASK_ROUTE = 'ask';

/** Schema names the generated clients use for the Ask enums. */
export const ASK_OUTCOME_SCHEMA_NAME = 'AskOutcome';
export const ASK_CONFIDENCE_SCHEMA_NAME = 'AskConfidence';

/**
 * Ask's rate limits, per caller: anonymous callers by IP address, signed-in people, API
 * keys and agents by identity, with more room. Crossmart pays for every answer; the daily cap across the
 * platform (`ASK_DAILY_QUESTION_CAP`) bounds the total whatever these allow.
 */
export const ASK_MINUTE_WINDOW_MS = 60_000;
export const ASK_DAY_WINDOW_MS = 24 * 60 * 60 * 1000;
export const ASK_ANONYMOUS_PER_MINUTE = 5;
export const ASK_ANONYMOUS_PER_DAY = 50;
export const ASK_AUTHENTICATED_PER_MINUTE = 20;
export const ASK_AUTHENTICATED_PER_DAY = 500;
/** The throttler named `default` sends a plain `Retry-After`; others add their name to it. */
export const ASK_MINUTE_THROTTLER = 'default';
export const ASK_DAY_THROTTLER = 'ask-day';

export const ASK_RATE_LIMITED_MESSAGE =
  'Too many questions from you. Wait a little and try again, or browse https://docs.crossmart.io.';

/** Escalations to a person (ADR 0025): `POST /ask/escalations`, `GET /ask/escalations/:id`. */
export const ASK_ESCALATIONS_ROUTE = 'ask/escalations';
export const ASK_ESCALATION_ID_PARAM = 'escalationId';
export const ASK_CHANNEL_SCHEMA_NAME = 'AskChannel';
export const ASK_ESCALATION_REASON_SCHEMA_NAME = 'AskEscalationReason';
export const ASK_ESCALATION_STATUS_SCHEMA_NAME = 'AskEscalationStatus';
export const ASK_CALLER_TYPE_SCHEMA_NAME = 'AskCallerType';
export const ASK_LOOKUP_KIND_SCHEMA_NAME = 'AccountLookupKind';
/** The header a caller's user agent is read from, hashed into its fingerprint. */
export const USER_AGENT_HEADER = 'user-agent';
/** Stands in for a missing user agent in the fingerprint. */
export const UNKNOWN_USER_AGENT = '';

/** The platform admins' view of Ask Crossmart: conversations, questions and escalations. */
export const ASK_ADMIN_TAG = 'Ask Crossmart admin';
export const ASK_ADMIN_ROUTE = 'admin/ask';
export const ASK_ADMIN_CONVERSATION_ID_PARAM = 'conversationId';
export const ASK_ADMIN_ESCALATION_ID_PARAM = 'escalationId';
export const ASK_ADMIN_PAGE_DEFAULT_LIMIT = 25;
export const ASK_ADMIN_PAGE_MAX_LIMIT = 100;
export const ASK_QUESTION_COUNT_DEFAULT_LIMIT = 20;
export const ASK_QUESTION_COUNT_MAX_LIMIT = 100;
