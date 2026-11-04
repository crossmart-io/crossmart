import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FileStorage } from '@crossmart/common';
import { detectImageType } from '../detect-image-type.js';
import { IMAGE_FILE_EXTENSIONS, type ImageContentType } from '../enums/image-content-type.enum.js';
import { PRODUCT_IMAGES_FOLDER, WORKSPACES_STORAGE_FOLDER } from '../media.constants.js';

export interface UploadedImage {
  url: string;
  contentType: ImageContentType;
  byteSize: number;
}

/** Stores product images. Files are named by the server, scoped to their workspace. */
@Injectable()
export class MediaService {
  constructor(private readonly storage: FileStorage) {}

  async uploadProductImage(workspaceId: string, content: Buffer): Promise<UploadedImage> {
    const contentType = detectImageType(content);
    if (!contentType) {
      throw new BadRequestException('Upload a JPEG, PNG, WebP or GIF image');
    }
    const key = [
      WORKSPACES_STORAGE_FOLDER,
      workspaceId,
      PRODUCT_IMAGES_FOLDER,
      `${randomUUID()}.${IMAGE_FILE_EXTENSIONS[contentType]}`,
    ].join('/');
    const { url } = await this.storage.put(key, content, contentType);
    return { url, contentType, byteSize: content.byteLength };
  }
}
