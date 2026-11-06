import type { ImageContentType } from '../enums/image-content-type.enum.js';

/** A file stored for a workspace, as recorded in the `uploads` table. */
export interface NewUpload {
  workspaceId: string;
  storageKey: string;
  /** The URL product media reference the file by. */
  url: string;
  byteSize: number;
  contentType: ImageContentType;
}

/** An upload whose grace period ended, due for deletion. */
export interface ExpiredUpload {
  id: string;
  storageKey: string;
}

/** What one cleanup run did. Counts only: keys and URLs never reach the logs. */
export interface UploadCleanupReport {
  /** Orphans a product uses again, no longer due for deletion. */
  reclaimed: number;
  /** Uploads no product uses, whose grace period starts now. */
  orphaned: number;
  /** Files and rows deleted after their grace period. */
  deleted: number;
  /** Deletions that failed and are retried on the next run. */
  failed: number;
}

/** What recording the files stored before tracking did. */
export interface UploadBackfillReport {
  /** Files recorded now. */
  recorded: number;
  /** Files that were already recorded. */
  alreadyRecorded: number;
  /** Files outside the product image layout, left alone. */
  skipped: number;
}
