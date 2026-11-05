import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import { type ContentGenerationJob, ContentGenerationRunner } from '@crossmart/core';
import { AI_WORKER_CONCURRENCY } from './ai-worker.constants.js';

/** Runs the Content Generator from the `ai` queue, the lowest-priority one. */
@Processor(QueueName.Ai, { concurrency: AI_WORKER_CONCURRENCY })
export class ContentGenerationProcessor extends WorkerHost {
  constructor(private readonly runner: ContentGenerationRunner) {
    super();
  }

  async process(job: Job<ContentGenerationJob>): Promise<void> {
    const attempts = job.opts.attempts ?? 1;
    await this.runner.run(job.data, { finalAttempt: job.attemptsMade + 1 >= attempts });
  }
}
