import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  CHANNEL_IMPORT_ATTEMPTS,
  CHANNEL_IMPORT_BACKOFF_MS,
  CHANNEL_IMPORT_JOB_NAME,
  CHANNEL_IMPORT_KEEP_COMPLETED,
  CHANNEL_IMPORT_KEEP_FAILED,
} from '../channel-import.constants.js';
import type { ChannelImportJobRef } from '../entities/channel-import.js';
import { ChannelImportQueue } from './channel-import.queue.js';

const EXPONENTIAL_BACKOFF = 'exponential';

/**
 * Queues imports on the lowest-priority `import` queue. The import job's id is the BullMQ job
 * id, so queuing the same import twice runs it once.
 */
@Injectable()
export class BullChannelImportQueue extends ChannelImportQueue {
  constructor(@InjectQueue(QueueName.Import) private readonly queue: Queue<ChannelImportJobRef>) {
    super();
  }

  async enqueue(job: ChannelImportJobRef): Promise<void> {
    await this.queue.add(CHANNEL_IMPORT_JOB_NAME, job, {
      jobId: job.jobId,
      attempts: CHANNEL_IMPORT_ATTEMPTS,
      backoff: { type: EXPONENTIAL_BACKOFF, delay: CHANNEL_IMPORT_BACKOFF_MS },
      removeOnComplete: CHANNEL_IMPORT_KEEP_COMPLETED,
      removeOnFail: CHANNEL_IMPORT_KEEP_FAILED,
    });
  }
}
