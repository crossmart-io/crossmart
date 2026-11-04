import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import {
  type CatalogImportResult,
  CatalogImportFormat,
  CatalogImportMode,
  type ImportIssue,
  ImportIssueCode,
} from '@crossmart/core';
import {
  CATALOG_IMPORT_FORMAT_SCHEMA_NAME,
  CATALOG_IMPORT_MODE_SCHEMA_NAME,
  IMPORT_ISSUE_CODE_SCHEMA_NAME,
} from '../catalog.constants.js';

/** Text fields of the multipart import form. The file itself arrives through multer. */
export class ImportProductsDto {
  @ApiProperty({ enum: CatalogImportFormat, enumName: CATALOG_IMPORT_FORMAT_SCHEMA_NAME })
  @IsEnum(CatalogImportFormat)
  format: CatalogImportFormat;

  @ApiPropertyOptional({
    enum: CatalogImportMode,
    enumName: CATALOG_IMPORT_MODE_SCHEMA_NAME,
    default: CatalogImportMode.Create,
    description:
      '`create` adds new products (Shopify CSV), `update` replaces products matched by handle ' +
      '(Shopify CSV) and `inventory` sets stock by SKU (inventory CSV)',
  })
  @IsOptional()
  @IsEnum(CatalogImportMode)
  mode: CatalogImportMode = CatalogImportMode.Create;
}

export class ImportIssueDto implements ImportIssue {
  @ApiProperty({ enum: ImportIssueCode, enumName: IMPORT_ISSUE_CODE_SCHEMA_NAME })
  code: ImportIssueCode;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  handle?: string;

  @ApiPropertyOptional()
  sku?: string;

  @ApiPropertyOptional({ description: 'Spreadsheet row number; the header is row 1' })
  row?: number;
}

export class CatalogImportResultDto implements CatalogImportResult {
  @ApiProperty({ format: 'uuid', description: 'The import history entry of this import' })
  jobId: string;

  @ApiProperty({ enum: CatalogImportMode, enumName: CATALOG_IMPORT_MODE_SCHEMA_NAME })
  mode: CatalogImportMode;

  @ApiProperty()
  createdProducts: number;

  @ApiProperty()
  createdVariants: number;

  @ApiProperty({ description: 'Products replaced by an update import' })
  updatedProducts: number;

  @ApiProperty({ description: 'Variants whose stock an inventory import set' })
  updatedVariants: number;

  @ApiProperty({
    type: [ImportIssueDto],
    description: 'Records left as they were: already in the catalog, not found, stock not tracked',
  })
  skipped: ImportIssueDto[];

  @ApiProperty({ type: [ImportIssueDto], description: 'Records that could not be imported' })
  failed: ImportIssueDto[];

  static from(result: CatalogImportResult): CatalogImportResultDto {
    const toIssue = (issue: ImportIssue): ImportIssueDto =>
      Object.assign(new ImportIssueDto(), issue);
    return Object.assign(new CatalogImportResultDto(), {
      ...result,
      skipped: result.skipped.map(toIssue),
      failed: result.failed.map(toIssue),
    });
  }
}
