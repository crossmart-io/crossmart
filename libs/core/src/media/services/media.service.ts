import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { FileStorage } from '@crossmart/common';
import { detectImageType } from '../detect-image-type.js';
import { IMAGE_FILE_EXTENSIONS, type ImageContentType } from '../enums/image-content-type.enum.js';
import {
  PRODUCT_IMAGES_FOLDER,
  WORKSPACE_STORAGE_FULL_MESSAGE,
  WORKSPACE_STORAGE_MAX_BYTES,
  WORKSPACES_STORAGE_FOLDER,
} from '../media.constants.js';

const KEY_SEPARATOR = '/';

export interface UploadedImage {
  url: string;
  contentType: ImageContentType;
  byteSize: number;
}

/**
 * Stores product images. Files are named by the server, scoped to their workspace, and a
 * workspace stores at most `WORKSPACE_STORAGE_MAX_BYTES`.
 */
@Injectable()
export class MediaService {
  constructor(private readonly storage: FileStorage) {}

  async uploadProductImage(workspaceId: string, content: Buffer): Promise<UploadedImage> {
    const contentType = detectImageType(content);
    if (!contentType) {
      throw new BadRequestException('Upload a JPEG, PNG, WebP or GIF image');
    }
    const workspaceFolder = [WORKSPACES_STORAGE_FOLDER, workspaceId].join(KEY_SEPARATOR);
    await this.assertRoomFor(workspaceFolder, content.byteLength);
    const key = [
      workspaceFolder,
      PRODUCT_IMAGES_FOLDER,
      `${randomUUID()}.${IMAGE_FILE_EXTENSIONS[contentType]}`,
    ].join(KEY_SEPARATOR);
    const { url } = await this.storage.put(key, content, contentType);
    return { url, contentType, byteSize: content.byteLength };
  }

  /** Throws 413 when the upload would take the workspace past its storage cap. */
  private async assertRoomFor(workspaceFolder: string, byteSize: number): Promise<void> {
    const used = await this.storage.usedBytes(workspaceFolder);
    if (used + byteSize > WORKSPACE_STORAGE_MAX_BYTES) {
      throw new PayloadTooLargeException(WORKSPACE_STORAGE_FULL_MESSAGE);
    }
  }
}
