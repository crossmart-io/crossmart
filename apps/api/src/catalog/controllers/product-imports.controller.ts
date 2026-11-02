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
import {
  type Actor,
  CatalogImportService,
  IMPORT_FILE_NAME_MAX_LENGTH,
  IMPORT_MAX_FILE_BYTES,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CATALOG_TAG,
  PRODUCT_IMPORTS_ROUTE,
  UPLOAD_FILE_FIELD,
  UPLOAD_FILE_NAME_CHARSET,
} from '../catalog.constants.js';
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
    FileInterceptor(UPLOAD_FILE_FIELD, {
      limits: { fileSize: IMPORT_MAX_FILE_BYTES, files: 1 },
      defParamCharset: UPLOAD_FILE_NAME_CHARSET,
    }),
  )
  @ApiConsumes(MULTIPART_FORM_DATA)
  @ApiBody({ schema: IMPORT_FORM_SCHEMA })
  @ApiOperation({
    summary: 'Import products or stock from a file',
    description:
      'In `create` mode, products whose handle is already in the catalog are skipped, never ' +
      'overwritten. In `update` mode, products are replaced by handle and their variants matched ' +
      'by SKU; stock is left as it is. In `inventory` mode, a `sku,available` CSV sets the stock ' +
      'of tracked variants. Invalid records are reported; the rest are applied. Every import is ' +
      'recorded in the import history.',
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
    @CurrentActor() actor: Actor,
  ): Promise<CatalogImportResultDto> {
    const result = await this.catalogImport.importFile(workspaceId, {
      mode: body.mode,
      format: body.format,
      fileName: file.originalname.slice(0, IMPORT_FILE_NAME_MAX_LENGTH),
      content: file.buffer,
      actor,
    });
    return CatalogImportResultDto.from(result);
  }
}
