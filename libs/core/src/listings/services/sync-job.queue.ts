import type { ListingSyncJob } from '../entities/listing-sync-job.js';

/**
 * Where sync jobs go. The BullMQ implementation puts each kind on its priority queue and
 * coalesces jobs for the same listing; tests replace it to run jobs inline.
 */
export abstract class SyncJobQueue {
  abstract enqueue(jobs: readonly ListingSyncJob[]): Promise<void>;
}
