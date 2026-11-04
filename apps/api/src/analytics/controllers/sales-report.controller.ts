import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SalesAnalyticsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ANALYTICS_ROUTE, ANALYTICS_TAG, SALES_REPORT_PATH } from '../analytics.constants.js';
import { SalesReportQueryDto } from '../dto/sales-report-query.dto.js';
import { SalesReportDto } from '../dto/sales-report.dto.js';

@ApiTags(ANALYTICS_TAG)
@Controller(ANALYTICS_ROUTE)
export class SalesReportController {
  constructor(private readonly sales: SalesAnalyticsService) {}

  @Get(SALES_REPORT_PATH)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Sales over time, by store, compared with the period before',
    description:
      'Order totals in the workspace currency, bucketed in the given time zone. ' +
      'Cancelled orders and orders in other currencies are left out.',
  })
  @ApiOkResponse({ type: SalesReportDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: SalesReportQueryDto,
  ): Promise<SalesReportDto> {
    return SalesReportDto.from(await this.sales.report(workspaceId, query));
  }
}
