import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingHealthReportService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  ANALYTICS_ROUTE,
  ANALYTICS_TAG,
  LISTING_HEALTH_REPORT_PATH,
} from '../analytics.constants.js';
import { ListingHealthReportDto } from '../dto/listing-health-report.dto.js';

@ApiTags(ANALYTICS_TAG)
@Controller(ANALYTICS_ROUTE)
export class ListingHealthReportController {
  constructor(private readonly listingHealth: ListingHealthReportService) {}

  @Get(LISTING_HEALTH_REPORT_PATH)
  @RequirePermission(WorkspacePermission.ViewReports)
  @ApiOperation({
    summary: 'Each store’s products by display state, and the latest failed listings, as of now',
    description:
      'Counts follow the same rule as each store’s product list. Each failed listing carries ' +
      '`displayState`, `displayReason` and `displayRequirement`, so a client can link to the fix.',
  })
  @ApiOkResponse({ type: ListingHealthReportDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<ListingHealthReportDto> {
    return ListingHealthReportDto.from(await this.listingHealth.report(workspaceId));
  }
}
