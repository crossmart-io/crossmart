import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { SortDirection } from '@crossmart/common';
import { SortDirectionProperty } from '../../common/sort-direction.decorator.js';
import {
  CatalogImportFormat,
  CatalogImportMode,
  IMPORT_JOB_PAGE_DEFAULT_LIMIT,
  IMPORT_JOB_PAGE_MAX_LIMIT,
  type ImportJobActor,
  type ImportJobCounts,
  type ImportJobDetail,
  type ImportJobIssueView,
  type ImportJobListQuery,
  type ImportJobPage,
  type ImportJobSummary,
} from '@crossmart/core';
import { ImportIssueOutcome, ImportJobStatus } from '@crossmart/database';
import {
  CATALOG_IMPORT_FORMAT_SCHEMA_NAME,
  CATALOG_IMPORT_MODE_SCHEMA_NAME,
  IMPORT_ISSUE_OUTCOME_SCHEMA_NAME,
  IMPORT_JOB_STATUS_SCHEMA_NAME,
} from '../catalog.constants.js';
import { ImportIssueDto } from './catalog-import.dto.js';
import { PageNumberProperty } from '../../common/page-number.decorator.js';

export class ListImportJobsQueryDto implements ImportJobListQuery {
  @ApiPropertyOptional({ enum: ImportJobStatus, enumName: IMPORT_JOB_STATUS_SCHEMA_NAME })
  @IsOptional()
  @IsEnum(ImportJobStatus)
  status?: ImportJobStatus;

  @ApiPropertyOptional({
    enum: CatalogImportFormat,
    enumName: CATALOG_IMPORT_FORMAT_SCHEMA_NAME,
    description: 'Where the records came from: a file of this format, or a channel',
  })
  @IsOptional()
  @IsEnum(CatalogImportFormat)
  format?: CatalogImportFormat;

  @SortDirectionProperty(SortDirection.Desc)
  direction?: SortDirection;

  @ApiPropertyOptional({ format: 'uuid', description: '`nextCursor` from the previous page' })
  @IsOptional()
  @IsUUID()
  cursor?: string;

  @PageNumberProperty()
  page?: number;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: IMPORT_JOB_PAGE_MAX_LIMIT,
    default: IMPORT_JOB_PAGE_DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(IMPORT_JOB_PAGE_MAX_LIMIT)
  limit: number = IMPORT_JOB_PAGE_DEFAULT_LIMIT;
}

export class ImportJobCountsDto implements ImportJobCounts {
  @ApiProperty()
  created: number;

  @ApiProperty({
    description: 'Channel products linked to catalog products they matched; zero for file imports',
  })
  linked: number;

  @ApiProperty({
    description:
      'Products replaced by an update import, variants whose stock an inventory import set, or ' +
      'products a channel import found already linked',
  })
  updated: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  failed: number;
}

export class ImportJobActorDto implements ImportJobActor {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  userId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The user who sent the file; null for API keys and deleted users',
  })
  userName: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  apiKeyId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'The API key that sent the file, if one did',
  })
  apiKeyName: string | null;
}

export class ImportJobDto implements ImportJobSummary {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: CatalogImportMode, enumName: CATALOG_IMPORT_MODE_SCHEMA_NAME })
  mode: CatalogImportMode;

  @ApiProperty({ enum: CatalogImportFormat, enumName: CATALOG_IMPORT_FORMAT_SCHEMA_NAME })
  format: CatalogImportFormat;

  @ApiProperty({ description: 'The file name, or the channel account a channel import read' })
  fileName: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'The channel connection a channel import reads; null for file imports',
  })
  connectionId: string | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Records the source holds, when it reports them, to show progress',
  })
  totalCount: number | null;

  @ApiProperty({ enum: ImportJobStatus, enumName: IMPORT_JOB_STATUS_SCHEMA_NAME })
  status: ImportJobStatus;

  @ApiProperty({
    type: ImportJobCountsDto,
    description: 'Products for create and update imports; stock rows for inventory imports',
  })
  counts: ImportJobCountsDto;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Why the whole file was rejected',
  })
  errorMessage: string | null;

  @ApiProperty({ type: ImportJobActorDto })
  actor: ImportJobActorDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: Date, nullable: true })
  finishedAt: Date | null;

  static from(job: ImportJobSummary): ImportJobDto {
    return Object.assign(new ImportJobDto(), {
      ...job,
      counts: Object.assign(new ImportJobCountsDto(), job.counts),
      actor: Object.assign(new ImportJobActorDto(), job.actor),
    });
  }
}

export class ImportJobIssueDto extends ImportIssueDto implements ImportJobIssueView {
  @ApiProperty({ enum: ImportIssueOutcome, enumName: IMPORT_ISSUE_OUTCOME_SCHEMA_NAME })
  outcome: ImportIssueOutcome;
}

export class ImportJobDetailDto extends ImportJobDto implements ImportJobDetail {
  @ApiProperty({
    type: [ImportJobIssueDto],
    description: 'Skipped and failed records, in file order',
  })
  issues: ImportJobIssueDto[];

  static override from(job: ImportJobDetail): ImportJobDetailDto {
    return Object.assign(new ImportJobDetailDto(), ImportJobDto.from(job), {
      issues: job.issues.map((issue) => Object.assign(new ImportJobIssueDto(), issue)),
    });
  }
}

export class ImportJobPageDto implements ImportJobPage {
  @ApiProperty({ type: [ImportJobDto] })
  items: ImportJobDto[];

  @ApiProperty({ type: String, nullable: true, description: 'Null on the last page' })
  nextCursor: string | null;

  @ApiProperty({ description: 'How many match in all, for page numbers' })
  total: number;

  static from(page: ImportJobPage): ImportJobPageDto {
    return Object.assign(new ImportJobPageDto(), {
      items: page.items.map((item) => ImportJobDto.from(item)),
      nextCursor: page.nextCursor,
      total: page.total,
    });
  }
}
