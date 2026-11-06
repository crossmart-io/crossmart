import { Injectable } from '@nestjs/common';
import { FileStorage, type ListedFile } from '@crossmart/common';
import type { NewUpload, UploadBackfillReport } from '../entities/upload.js';
import { UPLOAD_BACKFILL_BATCH_SIZE, WORKSPACES_STORAGE_FOLDER } from '../media.constants.js';
import { UploadRepository } from '../repositories/upload.repository.js';
import { parseProductImageKey } from '../rules/product-image-key.js';

/**
 * Records the product images stored before uploads were tracked, by listing the storage. Safe
 * to run again: recorded files are left as they are, and it never deletes anything. A file a
 * product uses is recorded under the URL the product uses, so a changed `MEDIA_PUBLIC_URL`
 * never makes a used file look orphaned. Files no product uses are cleaned up after the grace
 * period, like any orphan.
 */
@Injectable()
export class UploadBackfillService {
  constructor(
    private readonly storage: FileStorage,
    private readonly uploads: UploadRepository,
  ) {}

  async backfill(): Promise<UploadBackfillReport> {
    const report: UploadBackfillReport = { recorded: 0, alreadyRecorded: 0, skipped: 0 };
    let batch: NewUpload[] = [];
    for await (const file of this.storage.list(WORKSPACES_STORAGE_FOLDER)) {
      const upload = UploadBackfillService.toUpload(file);
      if (!upload) {
        report.skipped += 1;
        continue;
      }
      batch.push(upload);
      if (batch.length >= UPLOAD_BACKFILL_BATCH_SIZE) {
        await this.recordBatch(batch, report);
        batch = [];
      }
    }
    await this.recordBatch(batch, report);
    return report;
  }

  private async recordBatch(batch: NewUpload[], report: UploadBackfillReport): Promise<void> {
    if (batch.length === 0) return;
    const referencingUrls = await this.uploads.findReferencingUrls(batch);
    const recorded = await this.uploads.recordMissing(
      batch.map((upload) => ({
        ...upload,
        url: referencingUrls.get(upload.storageKey) ?? upload.url,
      })),
    );
    report.recorded += recorded;
    report.alreadyRecorded += batch.length - recorded;
  }

  private static toUpload(file: ListedFile): NewUpload | null {
    const parts = parseProductImageKey(file.key);
    if (!parts) return null;
    return { ...parts, storageKey: file.key, url: file.url, byteSize: file.byteSize };
  }
}
