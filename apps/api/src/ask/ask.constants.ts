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

/** How a rate-limit tracker names the kind of caller: `ip:<address>`, `user:<id>`, `api-key:<id>`,
 * `agent:<client id>:<user id>`. */
export const IP_TRACKER_KIND = 'ip';
export const UNKNOWN_CLIENT_IP = 'unknown';
