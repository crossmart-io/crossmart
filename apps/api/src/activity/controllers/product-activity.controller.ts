import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { PRODUCT_ID_PARAM } from '../../catalog/catalog.constants.js';
import { ACTIVITY_TAG, PRODUCT_ACTIVITY_ROUTE } from '../activity.constants.js';
import { ActivityPageDto } from '../dto/activity-event.dto.js';
import { ActivityFilterQueryDto } from '../dto/list-activity-query.dto.js';

@ApiTags(ACTIVITY_TAG)
@Controller(PRODUCT_ACTIVITY_ROUTE)
export class ProductActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'The history of one product, newest first',
    description: 'Includes bulk actions that changed it, and its deletion.',
  })
  @ApiOkResponse({ type: ActivityPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
    @Query() query: ActivityFilterQueryDto,
  ): Promise<ActivityPageDto> {
    return ActivityPageDto.from(await this.activity.listForProduct(workspaceId, productId, query));
  }
}
