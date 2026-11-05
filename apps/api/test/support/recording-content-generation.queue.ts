import { type ContentGenerationJob, ContentGenerationQueue } from '@crossmart/core';

/** Keeps content generation jobs instead of sending them to Redis; tests run them with the runner. */
export class RecordingContentGenerationQueue extends ContentGenerationQueue {
  private pending: ContentGenerationJob[] = [];

  enqueue(jobs: readonly ContentGenerationJob[]): Promise<void> {
    this.pending.push(...jobs);
    return Promise.resolve();
  }

  /** The queued jobs, and clears them. */
  drain(): ContentGenerationJob[] {
    const jobs = this.pending;
    this.pending = [];
    return jobs;
  }
}
