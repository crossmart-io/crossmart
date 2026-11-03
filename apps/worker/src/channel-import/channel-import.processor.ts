import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  type ChannelImportJobRef,
  ChannelImportRunner,
  IMPORT_SWEEP_JOB_NAME,
  StalledImportSweeper,
} from '@crossmart/core';

/**
 * Runs channel catalog imports from the `import` queue, the lowest-priority one, and the
 * scheduled sweep that closes imports whose worker died.
 */
@Processor(QueueName.Import)
export class ChannelImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ChannelImportProcessor.name);

  constructor(
    private readonly runner: ChannelImportRunner,
    private readonly sweeper: StalledImportSweeper,
  ) {
    super();
  }

  async process(job: Job<ChannelImportJobRef>): Promise<void> {
    if (job.name === IMPORT_SWEEP_JOB_NAME) {
      const closed = await this.sweeper.sweep();
      if (closed > 0) this.logger.warn(`Closed ${closed} stalled imports`);
      return;
    }
    const attempts = job.opts.attempts ?? 1;
    await this.runner.run(job.data, { finalAttempt: job.attemptsMade + 1 >= attempts });
  }
}
