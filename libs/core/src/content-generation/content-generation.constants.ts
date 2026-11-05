/** Products one request may ask content for; larger catalogs are asked for in pages. */
export const CONTENT_GENERATION_MAX_PRODUCTS = 100;

export const CONTENT_GENERATION_JOB_NAME = 'content-generation';
/** Retries for outages and rate limits the SDK's own retries did not absorb. */
export const CONTENT_GENERATION_ATTEMPTS = 3;
export const CONTENT_GENERATION_BACKOFF_MS = 30_000;
export const CONTENT_GENERATION_KEEP_COMPLETED = 1_000;
export const CONTENT_GENERATION_KEEP_FAILED = 5_000;
/** Separates the parts of a job's deduplication key: `content-generation:<connection>:<product>`. */
export const CONTENT_GENERATION_KEY_SEPARATOR = ':';

/** Longest rationale kept with a suggestion. */
export const RATIONALE_MAX_LENGTH = 500;
/**
 * Longest product description sent to the model, in characters. Real descriptions are far
 * shorter; the cap bounds the cost of a pathological one.
 */
export const PROMPT_DESCRIPTION_MAX_LENGTH = 20_000;
/** Distinct option values sent to the model ("Blue", "Large"); more add cost, not meaning. */
export const PROMPT_OPTION_VALUES_MAX = 50;

export const CONTENT_GENERATION_UNSUPPORTED_CHANNEL =
  'AI content is not available for this channel yet';
export const CONTENT_GENERATION_PRODUCTS_NOT_FOUND =
  'Some of these products do not exist in this workspace';

/** Why an answer was rejected when cleaning its markup left nothing. Never the content. */
export const EMPTY_AFTER_CLEANING = 'the answer was empty once its markup was cleaned';

/** Longest merchant instruction for a rewrite ("shorter", "mention it is dishwasher-safe"). */
export const CONTENT_DRAFT_INSTRUCTION_MAX_LENGTH = 500;
/** Longest text sent in as the field being edited; the prompt keeps less of it. */
export const CONTENT_DRAFT_TEXT_MAX_LENGTH = 100_000;
