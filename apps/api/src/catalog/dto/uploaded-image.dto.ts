import { ApiProperty } from '@nestjs/swagger';
import { ImageContentType, type UploadedImage } from '@crossmart/core';
import { IMAGE_CONTENT_TYPE_SCHEMA_NAME } from '../catalog.constants.js';

export class UploadedImageDto implements UploadedImage {
  @ApiProperty({ description: 'Use it as a product media `url`' })
  url: string;

  @ApiProperty({ enum: ImageContentType, enumName: IMAGE_CONTENT_TYPE_SCHEMA_NAME })
  contentType: ImageContentType;

  @ApiProperty()
  byteSize: number;

  static from(image: UploadedImage): UploadedImageDto {
    return Object.assign(new UploadedImageDto(), image);
  }
}
