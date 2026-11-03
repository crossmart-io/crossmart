import { Processor, WorkerHost } from '@nestjs/bullmq';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import { type ChannelImportJobRef, ChannelImportRunner } from '@crossmart/core';

/** Runs channel catalog imports from the `import` queue, the lowest-priority one. */
@Processor(QueueName.Import)
export class ChannelImportProcessor extends WorkerHost {
  constructor(private readonly runner: ChannelImportRunner) {
    super();
  }

  async process(job: Job<ChannelImportJobRef>): Promise<void> {
    const attempts = job.opts.attempts ?? 1;
    await this.runner.run(job.data, { finalAttempt: job.attemptsMade + 1 >= attempts });
  }
}
