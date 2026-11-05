/** Shown wherever an AI feature is used while no provider key is set. */
export const AI_NOT_CONFIGURED_MESSAGE =
  'AI is not configured. Set ANTHROPIC_API_KEY on the server to turn on the AI features.';

/** Shown when the provider refuses the server's key; only the operator can fix it. */
export const AI_KEY_REJECTED_MESSAGE =
  'The AI provider rejected this server’s key. Check ANTHROPIC_API_KEY on the server.';

/** Shown when the provider is unreachable, overloaded or rate limiting. */
export const AI_PROVIDER_UNAVAILABLE_MESSAGE =
  'The AI service could not answer right now. Try again in a moment.';

/** Shown when a model's answer is refused, cut off or does not match its schema. */
export const AI_OUTPUT_REJECTED_MESSAGE = 'The AI answer was not usable, so nothing was saved';

/**
 * Room for the model's reasoning plus the answer. Answers are short (a title and a
 * description), but adaptive thinking spends output tokens too.
 */
export const AI_MAX_OUTPUT_TOKENS = 16_000;

/** Usage reports cover the current calendar month (UTC) unless a period is given. */
export const AI_USAGE_DEFAULT_PERIOD_MONTHS = 1;
