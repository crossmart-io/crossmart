import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivityService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ACTIVITY_ROUTE, ACTIVITY_TAG } from '../activity.constants.js';
import { ActivityPageDto } from '../dto/activity-event.dto.js';
import { ListActivityQueryDto } from '../dto/list-activity-query.dto.js';

@ApiTags(ACTIVITY_TAG)
@Controller(ACTIVITY_ROUTE)
export class ActivityController {
  constructor(private readonly activity: ActivityService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewActivity)
  @ApiOperation({
    summary: 'Who changed what in the workspace, newest first',
    description: 'Includes operations that failed, such as an import that created nothing.',
  })
  @ApiOkResponse({ type: ActivityPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListActivityQueryDto,
  ): Promise<ActivityPageDto> {
    return ActivityPageDto.from(await this.activity.list(workspaceId, query));
  }
}
