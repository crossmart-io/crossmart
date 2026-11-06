import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { QueueName } from '@crossmart/common';
import { type UploadCleanupReport, UploadCleanupService } from '@crossmart/core';

/**
 * Runs the scheduled upload cleanup from the `storage` queue. It lives in the API because the
 * local storage driver keeps files on the API's disk, which the worker cannot reach.
 */
@Processor(QueueName.Storage)
export class UploadCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(UploadCleanupProcessor.name);

  constructor(private readonly cleanup: UploadCleanupService) {
    super();
  }

  async process(): Promise<UploadCleanupReport> {
    const report = await this.cleanup.cleanUp();
    const { reclaimed, orphaned, deleted, failed } = report;
    const summary = `reclaimed ${reclaimed}, orphaned ${orphaned}, deleted ${deleted}, failed ${failed}`;
    if (failed > 0) this.logger.warn(`Upload cleanup: ${summary}`);
    else if (orphaned + deleted + reclaimed > 0) this.logger.log(`Upload cleanup: ${summary}`);
    return report;
  }
}
