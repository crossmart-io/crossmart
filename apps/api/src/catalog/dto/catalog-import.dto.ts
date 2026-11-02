import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import {
  type CatalogImportResult,
  CatalogImportFormat,
  type ImportIssue,
  ImportIssueCode,
} from '@crossmart/core';
import {
  CATALOG_IMPORT_FORMAT_SCHEMA_NAME,
  IMPORT_ISSUE_CODE_SCHEMA_NAME,
} from '../catalog.constants.js';

/** Text fields of the multipart import form. The file itself arrives through multer. */
export class ImportProductsDto {
  @ApiProperty({ enum: CatalogImportFormat, enumName: CATALOG_IMPORT_FORMAT_SCHEMA_NAME })
  @IsEnum(CatalogImportFormat)
  format: CatalogImportFormat;
}

export class ImportIssueDto implements ImportIssue {
  @ApiProperty({ enum: ImportIssueCode, enumName: IMPORT_ISSUE_CODE_SCHEMA_NAME })
  code: ImportIssueCode;

  @ApiProperty()
  message: string;

  @ApiPropertyOptional()
  handle?: string;

  @ApiPropertyOptional({ description: 'Spreadsheet row number; the header is row 1' })
  row?: number;
}

export class CatalogImportResultDto implements CatalogImportResult {
  @ApiProperty()
  createdProducts: number;

  @ApiProperty()
  createdVariants: number;

  @ApiProperty({
    type: [ImportIssueDto],
    description: 'Products already in the catalog, left untouched',
  })
  skipped: ImportIssueDto[];

  @ApiProperty({ type: [ImportIssueDto], description: 'Products that could not be imported' })
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
