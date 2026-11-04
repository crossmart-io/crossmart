import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  WorkspaceAccessService,
  WorkspaceDeletionService,
  WorkspacePermission,
} from '@crossmart/core';
import type { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceRole } from '../../auth/decorators/workspace-role.decorator.js';
import { DeleteWorkspaceDto } from '../dto/delete-workspace.dto.js';
import { WorkspaceDto } from '../dto/workspace.dto.js';
import { WORKSPACE_ROUTE, WORKSPACES_TAG } from '../workspaces.constants.js';

@ApiTags(WORKSPACES_TAG)
@Controller(WORKSPACE_ROUTE)
export class WorkspacesController {
  constructor(
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly deletion: WorkspaceDeletionService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({ summary: 'A workspace and your role in it' })
  @ApiOkResponse({ type: WorkspaceDto })
  async getWorkspace(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentWorkspaceRole() role: WorkspaceRole,
  ): Promise<WorkspaceDto> {
    return WorkspaceDto.from(await this.workspaceAccess.getWorkspace(workspaceId, role));
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(WorkspacePermission.DeleteWorkspace)
  @ApiOperation({
    summary: 'Delete a workspace and everything in it',
    description:
      'Disconnects every store (removing the app unless another workspace uses the store), then ' +
      'deletes products, stock, listings, orders, activity and API keys. It cannot be undone.',
  })
  @ApiNoContentResponse()
  async deleteWorkspace(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: DeleteWorkspaceDto,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    await this.deletion.deleteConfirmed(workspaceId, body.confirmName, actor);
  }
}
