import { Logger, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppConfigModule, StorageModule } from '@crossmart/common';
import { MediaModule, UploadBackfillService } from '@crossmart/core';
import { DatabaseModule } from '@crossmart/database';

const LOG_CONTEXT = 'UploadBackfill';

/** Only what the backfill needs: no HTTP server and no queue processors. */
@Module({ imports: [AppConfigModule, DatabaseModule, StorageModule, MediaModule] })
class UploadBackfillModule {}

/**
 * Records the files stored before uploads were tracked, logs the counts and exits. Run it where
 * the files are, with `node dist/apps/api/main.js --backfill-uploads` (see docs/architecture.md).
 */
export async function backfillUploads(): Promise<void> {
  const app = await NestFactory.createApplicationContext(UploadBackfillModule);
  try {
    const { recorded, alreadyRecorded, skipped } = await app.get(UploadBackfillService).backfill();
    Logger.log(
      `Recorded ${recorded} files; ${alreadyRecorded} were already recorded, ${skipped} skipped`,
      LOG_CONTEXT,
    );
  } finally {
    await app.close();
  }
}
