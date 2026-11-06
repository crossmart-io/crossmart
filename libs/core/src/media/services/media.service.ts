import { BadRequestException, Injectable, PayloadTooLargeException } from '@nestjs/common';
import { FileStorage } from '@crossmart/common';
import { detectImageType } from '../detect-image-type.js';
import type { NewUpload } from '../entities/upload.js';
import type { ImageContentType } from '../enums/image-content-type.enum.js';
import {
  UNSUPPORTED_IMAGE_MESSAGE,
  WORKSPACE_STORAGE_FULL_MESSAGE,
  WORKSPACE_STORAGE_MAX_BYTES,
} from '../media.constants.js';
import { UploadRepository } from '../repositories/upload.repository.js';
import { productImageKey } from '../rules/product-image-key.js';

export interface UploadedImage {
  url: string;
  contentType: ImageContentType;
  byteSize: number;
}

/**
 * Stores product images. Files are named by the server, scoped to their workspace, and recorded
 * in `uploads`, so a workspace stores at most `WORKSPACE_STORAGE_MAX_BYTES` and files no product
 * uses are cleaned up (`UploadCleanupService`).
 */
@Injectable()
export class MediaService {
  constructor(
    private readonly storage: FileStorage,
    private readonly uploads: UploadRepository,
  ) {}

  async uploadProductImage(workspaceId: string, content: Buffer): Promise<UploadedImage> {
    const contentType = detectImageType(content);
    if (!contentType) {
      throw new BadRequestException(UNSUPPORTED_IMAGE_MESSAGE);
    }
    await this.assertRoomFor(workspaceId, content.byteLength);
    const storageKey = productImageKey(workspaceId, contentType);
    const { url } = await this.storage.put(storageKey, content, contentType);
    await this.record({ workspaceId, storageKey, url, byteSize: content.byteLength, contentType });
    return { url, contentType, byteSize: content.byteLength };
  }

  /** The bytes the workspace stores, counted against `WORKSPACE_STORAGE_MAX_BYTES`. */
  usedBytes(workspaceId: string): Promise<number> {
    return this.uploads.usedBytes(workspaceId);
  }

  /** Throws 413 when the upload would take the workspace past its storage cap. */
  private async assertRoomFor(workspaceId: string, byteSize: number): Promise<void> {
    const used = await this.usedBytes(workspaceId);
    if (used + byteSize > WORKSPACE_STORAGE_MAX_BYTES) {
      throw new PayloadTooLargeException(WORKSPACE_STORAGE_FULL_MESSAGE);
    }
  }

  /** A file that cannot be recorded is deleted, so it never escapes the quota and the cleanup. */
  private async record(upload: NewUpload): Promise<void> {
    try {
      await this.uploads.record(upload);
    } catch (error) {
      await this.storage.delete(upload.storageKey);
      throw error;
    }
  }
}
