import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InventoryReportService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ANALYTICS_ROUTE, ANALYTICS_TAG, INVENTORY_REPORT_PATH } from '../analytics.constants.js';
import { InventoryReportDto } from '../dto/inventory-report.dto.js';

@ApiTags(ANALYTICS_TAG)
@Controller(ANALYTICS_ROUTE)
export class InventoryReportController {
  constructor(private readonly inventory: InventoryReportService) {}

  @Get(INVENTORY_REPORT_PATH)
  @RequirePermission(WorkspacePermission.ViewReports)
  @ApiOperation({
    summary: 'Stock value, stock levels and each store’s listings, as of now',
    description: 'Values are in the workspace currency; variants without a cost are counted apart.',
  })
  @ApiOkResponse({ type: InventoryReportDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<InventoryReportDto> {
    return InventoryReportDto.from(await this.inventory.report(workspaceId));
  }
}
