import { randomUUID } from 'node:crypto';
import { IMAGE_FILE_EXTENSIONS, ImageContentType } from '../enums/image-content-type.enum.js';
import {
  PRODUCT_IMAGES_FOLDER,
  STORAGE_KEY_SEPARATOR,
  WORKSPACES_STORAGE_FOLDER,
} from '../media.constants.js';

/** What a product image's storage key says about it. */
export interface ProductImageKeyParts {
  workspaceId: string;
  contentType: ImageContentType;
}

const EXTENSION_SEPARATOR = '.';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTENT_TYPE_BY_EXTENSION = new Map(
  Object.values(ImageContentType).map((type) => [IMAGE_FILE_EXTENSIONS[type], type]),
);

/** A new, server-chosen key: `workspaces/<workspaceId>/products/<uuid>.<extension>`. */
export function productImageKey(workspaceId: string, contentType: ImageContentType): string {
  const fileName = [randomUUID(), IMAGE_FILE_EXTENSIONS[contentType]].join(EXTENSION_SEPARATOR);
  return [WORKSPACES_STORAGE_FOLDER, workspaceId, PRODUCT_IMAGES_FOLDER, fileName].join(
    STORAGE_KEY_SEPARATOR,
  );
}

/** Reads a key `productImageKey` made; null for any other file. */
export function parseProductImageKey(key: string): ProductImageKeyParts | null {
  const [root, workspaceId, folder, fileName, ...rest] = key.split(STORAGE_KEY_SEPARATOR);
  const isProductImage =
    rest.length === 0 &&
    root === WORKSPACES_STORAGE_FOLDER &&
    folder === PRODUCT_IMAGES_FOLDER &&
    workspaceId !== undefined &&
    UUID_PATTERN.test(workspaceId);
  if (!isProductImage || fileName === undefined) return null;
  const contentType = CONTENT_TYPE_BY_EXTENSION.get(extensionOf(fileName));
  return contentType ? { workspaceId, contentType } : null;
}

function extensionOf(fileName: string): string {
  const separatorAt = fileName.lastIndexOf(EXTENSION_SEPARATOR);
  return separatorAt > 0 ? fileName.slice(separatorAt + 1) : '';
}
