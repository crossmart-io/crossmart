/** How many order ids the trigger remembers, so an order is never emitted twice. */
export const MAX_REMEMBERED_IDS = 1000;

/** The most pages one poll reads, so a long outage cannot make a poll run for ever. */
export const MAX_PAGES_PER_POLL = 10;

/** How many items a manual run ("Fetch Test Event") returns. */
export const SAMPLE_SIZE = 1;

/** Separates a listing's id from its error in a failure key. */
export const FAILURE_KEY_SEPARATOR = '|';
