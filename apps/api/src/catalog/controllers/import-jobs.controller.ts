import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ImportJobsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CATALOG_TAG, IMPORT_JOB_ID_PARAM, IMPORT_JOBS_ROUTE } from '../catalog.constants.js';
import {
  ImportJobDetailDto,
  ImportJobPageDto,
  ListImportJobsQueryDto,
} from '../dto/import-job.dto.js';

@ApiTags(CATALOG_TAG)
@Controller(IMPORT_JOBS_ROUTE)
@RequirePermission(WorkspacePermission.ViewProducts)
export class ImportJobsController {
  constructor(private readonly jobs: ImportJobsService) {}

  @Get()
  @ApiOperation({ summary: 'Import history of a workspace, newest first' })
  @ApiOkResponse({ type: ImportJobPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListImportJobsQueryDto,
  ): Promise<ImportJobPageDto> {
    return ImportJobPageDto.from(await this.jobs.list(workspaceId, query));
  }

  @Get(`:${IMPORT_JOB_ID_PARAM}`)
  @ApiOperation({ summary: 'An import with its skipped and failed records' })
  @ApiOkResponse({ type: ImportJobDetailDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(IMPORT_JOB_ID_PARAM, ParseUUIDPipe) jobId: string,
  ): Promise<ImportJobDetailDto> {
    return ImportJobDetailDto.from(await this.jobs.get(workspaceId, jobId));
  }
}
