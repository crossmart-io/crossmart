import {
  Controller,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MAX_IMAGE_BYTES, MediaService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CATALOG_TAG, UPLOAD_FILE_FIELD, PRODUCT_IMAGES_ROUTE } from '../catalog.constants.js';
import { UploadedImageDto } from '../dto/uploaded-image.dto.js';

const MULTIPART_FORM_DATA = 'multipart/form-data';

const IMAGE_FORM_SCHEMA = {
  type: 'object',
  required: [UPLOAD_FILE_FIELD],
  properties: {
    [UPLOAD_FILE_FIELD]: {
      type: 'string',
      format: 'binary',
      description: 'JPEG, PNG, WebP or GIF',
    },
  },
};

@ApiTags(CATALOG_TAG)
@Controller(PRODUCT_IMAGES_ROUTE)
@RequirePermission(WorkspacePermission.EditCatalog)
export class ProductImagesController {
  constructor(private readonly media: MediaService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor(UPLOAD_FILE_FIELD, { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }),
  )
  @ApiConsumes(MULTIPART_FORM_DATA)
  @ApiBody({ schema: IMAGE_FORM_SCHEMA })
  @ApiOperation({
    summary: 'Upload a product image',
    description: 'Returns a URL to put in a product’s `media`. The format is read from the file.',
  })
  @ApiCreatedResponse({ type: UploadedImageDto })
  async upload(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @UploadedFile(
      new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES })] }),
    )
    file: Express.Multer.File,
  ): Promise<UploadedImageDto> {
    return UploadedImageDto.from(await this.media.uploadProductImage(workspaceId, file.buffer));
  }
}
