import {
  Body,
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
import {
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { CatalogImportService, IMPORT_MAX_FILE_BYTES, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CATALOG_TAG, UPLOAD_FILE_FIELD, PRODUCT_IMPORTS_ROUTE } from '../catalog.constants.js';
import { CatalogImportResultDto, ImportProductsDto } from '../dto/catalog-import.dto.js';

const MULTIPART_FORM_DATA = 'multipart/form-data';

/** The form fields plus the binary file part, for the OpenAPI document. */
const IMPORT_FORM_SCHEMA = {
  allOf: [
    { $ref: getSchemaPath(ImportProductsDto) },
    {
      type: 'object',
      required: [UPLOAD_FILE_FIELD],
      properties: {
        [UPLOAD_FILE_FIELD]: { type: 'string', format: 'binary', description: 'The catalog file' },
      },
    },
  ],
};

@ApiTags(CATALOG_TAG)
@ApiExtraModels(ImportProductsDto)
@Controller(PRODUCT_IMPORTS_ROUTE)
@RequirePermission(WorkspacePermission.EditCatalog)
export class ProductImportsController {
  constructor(private readonly catalogImport: CatalogImportService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor(UPLOAD_FILE_FIELD, { limits: { fileSize: IMPORT_MAX_FILE_BYTES, files: 1 } }),
  )
  @ApiConsumes(MULTIPART_FORM_DATA)
  @ApiBody({ schema: IMPORT_FORM_SCHEMA })
  @ApiOperation({
    summary: 'Import products from a file',
    description:
      'Products whose handle is already in the catalog are skipped, never overwritten. ' +
      'Invalid products are reported; the rest are created.',
  })
  @ApiCreatedResponse({ type: CatalogImportResultDto })
  async import(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: ImportProductsDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [new MaxFileSizeValidator({ maxSize: IMPORT_MAX_FILE_BYTES })],
      }),
    )
    file: Express.Multer.File,
  ): Promise<CatalogImportResultDto> {
    const result = await this.catalogImport.importFile(workspaceId, body.format, file.buffer);
    return CatalogImportResultDto.from(result);
  }
}
