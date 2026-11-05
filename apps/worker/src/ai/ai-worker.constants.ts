/**
 * AI jobs run at once per worker. Each mostly waits on the model, so a few overlap well; the
 * provider's rate limits, not the CPU, set the ceiling.
 */
export const AI_WORKER_CONCURRENCY = 4;
