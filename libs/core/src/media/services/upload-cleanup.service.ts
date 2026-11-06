import { Injectable } from '@nestjs/common';
import { FileStorage } from '@crossmart/common';
import type { ExpiredUpload, UploadCleanupReport } from '../entities/upload.js';
import {
  UPLOAD_CLEANUP_BATCH_SIZE,
  UPLOAD_CLEANUP_WORKSPACES_PER_RUN,
  UPLOAD_ORPHAN_GRACE_MS,
} from '../media.constants.js';
import { UploadRepository } from '../repositories/upload.repository.js';

type DeletionCounts = Pick<UploadCleanupReport, 'deleted' | 'failed'>;

/**
 * Deletes uploaded files no product uses any more. An upload no product media of its workspace
 * references is marked orphaned; it is deleted only after `UPLOAD_ORPHAN_GRACE_MS`, and only if
 * still unused then. Attaching it again clears the mark (a database trigger does it on every
 * media write), so a removed image that comes back is safe. Images imported from channels are
 * external URLs, never in `uploads`, so they are never touched. Runs workspace by workspace,
 * with bounded batches.
 */
@Injectable()
export class UploadCleanupService {
  constructor(
    private readonly uploads: UploadRepository,
    private readonly storage: FileStorage,
  ) {}

  /** One scheduled run over the workspaces with cleanup to do. */
  async cleanUp(now: Date = new Date()): Promise<UploadCleanupReport> {
    const workspaceIds = await this.uploads.findWorkspacesToClean(
      UploadCleanupService.cutoff(now),
      UPLOAD_CLEANUP_WORKSPACES_PER_RUN,
    );
    const total: UploadCleanupReport = { reclaimed: 0, orphaned: 0, deleted: 0, failed: 0 };
    for (const workspaceId of workspaceIds) {
      const report = await this.cleanUpWorkspace(workspaceId, now);
      total.reclaimed += report.reclaimed;
      total.orphaned += report.orphaned;
      total.deleted += report.deleted;
      total.failed += report.failed;
    }
    return total;
  }

  async cleanUpWorkspace(
    workspaceId: string,
    now: Date = new Date(),
  ): Promise<UploadCleanupReport> {
    const reclaimed = await this.uploads.reclaimReferenced(workspaceId, UPLOAD_CLEANUP_BATCH_SIZE);
    const orphaned = await this.uploads.markOrphans(workspaceId, now, UPLOAD_CLEANUP_BATCH_SIZE);
    const { deleted, failed } = await this.deleteExpired(
      workspaceId,
      UploadCleanupService.cutoff(now),
    );
    return { reclaimed, orphaned, deleted, failed };
  }

  private async deleteExpired(workspaceId: string, cutoff: Date): Promise<DeletionCounts> {
    const expired = await this.uploads.findExpiredOrphans(
      workspaceId,
      cutoff,
      UPLOAD_CLEANUP_BATCH_SIZE,
    );
    const counts: DeletionCounts = { deleted: 0, failed: 0 };
    for (const upload of expired) {
      await this.deleteOne(upload, cutoff, counts);
    }
    return counts;
  }

  /** A failure is counted, never thrown, so one bad file does not stop the run. */
  private async deleteOne(
    upload: ExpiredUpload,
    cutoff: Date,
    counts: DeletionCounts,
  ): Promise<void> {
    try {
      const deleted = await this.uploads.deleteExpiredOrphan(upload, cutoff, (storageKey) =>
        this.storage.delete(storageKey),
      );
      if (deleted) counts.deleted += 1;
    } catch {
      counts.failed += 1;
    }
  }

  /** Uploads orphaned at or before this moment have had their full grace period. */
  private static cutoff(now: Date): Date {
    return new Date(now.getTime() - UPLOAD_ORPHAN_GRACE_MS);
  }
}
