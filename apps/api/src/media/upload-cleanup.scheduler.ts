import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QueueName } from '@crossmart/common';
import {
  UPLOAD_CLEANUP_INTERVAL_MS,
  UPLOAD_CLEANUP_JOB_NAME,
  UPLOAD_CLEANUP_SCHEDULER_ID,
} from '@crossmart/core';

/** Schedules the upload cleanup every hour; one schedule however many instances. */
@Injectable()
export class UploadCleanupScheduler implements OnApplicationBootstrap {
  constructor(@InjectQueue(QueueName.Storage) private readonly storageQueue: Queue) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.storageQueue.upsertJobScheduler(
      UPLOAD_CLEANUP_SCHEDULER_ID,
      { every: UPLOAD_CLEANUP_INTERVAL_MS },
      { name: UPLOAD_CLEANUP_JOB_NAME, data: {} },
    );
  }
}
