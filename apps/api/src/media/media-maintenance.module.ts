import { Module } from '@nestjs/common';
import { MediaModule } from '@crossmart/core';
import { UploadCleanupProcessor } from './upload-cleanup.processor.js';
import { UploadCleanupScheduler } from './upload-cleanup.scheduler.js';

/**
 * Cleans up uploaded files no product uses. Hosted by the API, next to the files, while
 * storage is the API's local disk; with object storage it can move to the worker.
 */
@Module({
  imports: [MediaModule],
  providers: [UploadCleanupScheduler, UploadCleanupProcessor],
})
export class MediaMaintenanceModule {}
