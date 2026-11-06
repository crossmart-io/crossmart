import { Module } from '@nestjs/common';
import { UploadRepository } from './repositories/upload.repository.js';
import { MediaService } from './services/media.service.js';
import { UploadBackfillService } from './services/upload-backfill.service.js';
import { UploadCleanupService } from './services/upload-cleanup.service.js';

/**
 * Product images and the `uploads` that track them. Storage comes from the global
 * `StorageModule`, so the app hosting this module must import it.
 */
@Module({
  providers: [UploadRepository, MediaService, UploadCleanupService, UploadBackfillService],
  exports: [MediaService, UploadCleanupService, UploadBackfillService],
})
export class MediaModule {}
