/** Marketplaces accept product images up to 20 MB or less. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const PRODUCT_IMAGES_FOLDER = 'products';
export const WORKSPACES_STORAGE_FOLDER = 'workspaces';

/**
 * The most a workspace may store in uploaded files, whatever its plan: a guard against filling
 * the disk or bucket, not a plan limit. Generous, as files are not yet cleaned up when products
 * stop using them.
 */
export const WORKSPACE_STORAGE_MAX_BYTES = 5 * 1024 * 1024 * 1024;
const BYTES_PER_GIB = 1024 * 1024 * 1024;
export const WORKSPACE_STORAGE_FULL_MESSAGE = `This workspace has used its ${
  WORKSPACE_STORAGE_MAX_BYTES / BYTES_PER_GIB
} GB of image storage, so no more images can be uploaded`;
