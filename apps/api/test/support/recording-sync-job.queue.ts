import { type ListingSyncJob, SyncJobQueue, syncJobKey } from '@crossmart/core';

/** Keeps enqueued jobs instead of sending them to Redis; tests run them with the runner. */
export class RecordingSyncJobQueue extends SyncJobQueue {
  private readonly pending = new Map<string, ListingSyncJob>();

  enqueue(jobs: readonly ListingSyncJob[]): Promise<void> {
    for (const job of jobs) {
      this.pending.set(syncJobKey(job), job);
    }
    return Promise.resolve();
  }

  /** The queued jobs, coalesced per listing and kind as BullMQ would, and clears them. */
  drain(): ListingSyncJob[] {
    const jobs = [...this.pending.values()];
    this.pending.clear();
    return jobs;
  }
}
