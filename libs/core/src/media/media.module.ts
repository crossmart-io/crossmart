import { Module } from '@nestjs/common';
import { MediaService } from './services/media.service.js';

/** Product images. Storage comes from the global `StorageModule`. */
@Module({
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
