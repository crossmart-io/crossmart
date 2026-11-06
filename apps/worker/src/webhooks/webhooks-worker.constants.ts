/**
 * Webhook jobs run at once per worker. A delivery mostly waits on the endpoint (up to its
 * timeout), so many overlap well; dispatch and retention jobs are quick.
 */
export const WEBHOOK_WORKER_CONCURRENCY = 20;
