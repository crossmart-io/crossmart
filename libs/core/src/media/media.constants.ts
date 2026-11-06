/** Marketplaces accept product images up to 20 MB or less. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const PRODUCT_IMAGES_FOLDER = 'products';
export const WORKSPACES_STORAGE_FOLDER = 'workspaces';
export const STORAGE_KEY_SEPARATOR = '/';

/**
 * The most a workspace may store in uploaded files, whatever its plan: a guard against filling
 * the disk or bucket, not a plan limit. Counted from the `uploads` table; files no product uses
 * count until the cleanup deletes them.
 */
export const WORKSPACE_STORAGE_MAX_BYTES = 5 * 1024 * 1024 * 1024;
const BYTES_PER_GIB = 1024 * 1024 * 1024;
export const WORKSPACE_STORAGE_FULL_MESSAGE = `This workspace has used its ${
  WORKSPACE_STORAGE_MAX_BYTES / BYTES_PER_GIB
} GB of image storage, so no more images can be uploaded`;
export const UNSUPPORTED_IMAGE_MESSAGE = 'Upload a JPEG, PNG, WebP or GIF image';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long an upload stays after no product uses it, before its file is deleted. Covers an image
 * uploaded now and attached later, edits in flight, and a mistaken removal undone within the week.
 */
export const UPLOAD_ORPHAN_GRACE_MS = 7 * DAY_MS;
/** How often the upload cleanup runs. */
export const UPLOAD_CLEANUP_INTERVAL_MS = HOUR_MS;
export const UPLOAD_CLEANUP_SCHEDULER_ID = 'upload-cleanup';
export const UPLOAD_CLEANUP_JOB_NAME = 'clean-up-uploads';
/** The most workspaces one run cleans up. The rest wait for the next run. */
export const UPLOAD_CLEANUP_WORKSPACES_PER_RUN = 50;
/**
 * The most uploads one run reclaims, marks or deletes per workspace, so a run stays short and
 * no workspace holds up the others.
 */
export const UPLOAD_CLEANUP_BATCH_SIZE = 200;

/** Run the API with this flag to record files stored before uploads were tracked, then exit. */
export const BACKFILL_UPLOADS_FLAG = '--backfill-uploads';
/** Files the backfill records per database write. */
export const UPLOAD_BACKFILL_BATCH_SIZE = 500;
