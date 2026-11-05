import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { JobsOptions, Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  CONTENT_GENERATION_ATTEMPTS,
  CONTENT_GENERATION_BACKOFF_MS,
  CONTENT_GENERATION_JOB_NAME,
  CONTENT_GENERATION_KEEP_COMPLETED,
  CONTENT_GENERATION_KEEP_FAILED,
  CONTENT_GENERATION_KEY_SEPARATOR,
} from '../content-generation.constants.js';
import type { ContentGenerationJob } from '../entities/content-generation.js';
import { ContentGenerationQueue } from './content-generation.queue.js';

const EXPONENTIAL_BACKOFF = 'exponential';

/** One product on one connection is generated once at a time, however often it is asked. */
export function contentGenerationKey(job: ContentGenerationJob): string {
  return [CONTENT_GENERATION_JOB_NAME, job.connectionId, job.productId].join(
    CONTENT_GENERATION_KEY_SEPARATOR,
  );
}

export function contentGenerationOptions(job: ContentGenerationJob): JobsOptions {
  return {
    deduplication: { id: contentGenerationKey(job) },
    attempts: CONTENT_GENERATION_ATTEMPTS,
    backoff: { type: EXPONENTIAL_BACKOFF, delay: CONTENT_GENERATION_BACKOFF_MS },
    removeOnComplete: CONTENT_GENERATION_KEEP_COMPLETED,
    removeOnFail: CONTENT_GENERATION_KEEP_FAILED,
  };
}

/** Puts content generation on the `ai` queue in one batch; `apps/worker` runs it. */
@Injectable()
export class BullContentGenerationQueue extends ContentGenerationQueue {
  constructor(@InjectQueue(QueueName.Ai) private readonly queue: Queue<ContentGenerationJob>) {
    super();
  }

  async enqueue(jobs: readonly ContentGenerationJob[]): Promise<void> {
    if (jobs.length === 0) return;
    await this.queue.addBulk(
      jobs.map((job) => ({
        name: CONTENT_GENERATION_JOB_NAME,
        data: job,
        opts: contentGenerationOptions(job),
      })),
    );
  }
}
