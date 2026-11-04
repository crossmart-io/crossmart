import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  type ResolvedRole,
  WorkspaceAccessService,
  WorkspaceDeletionService,
  WorkspacePermission,
  WorkspacesService,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceAccess } from '../../auth/decorators/workspace-access.decorator.js';
import { DeleteWorkspaceDto } from '../dto/delete-workspace.dto.js';
import { RenameWorkspaceDto } from '../dto/workspace-input.dto.js';
import { WorkspaceDto } from '../dto/workspace.dto.js';
import { WORKSPACE_ROUTE, WORKSPACES_TAG } from '../workspaces.constants.js';

@ApiTags(WORKSPACES_TAG)
@Controller(WORKSPACE_ROUTE)
export class WorkspacesController {
  constructor(
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly deletion: WorkspaceDeletionService,
    private readonly workspaces: WorkspacesService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({ summary: 'A workspace and your role in it' })
  @ApiOkResponse({ type: WorkspaceDto })
  async getWorkspace(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentWorkspaceAccess() access: ResolvedRole,
  ): Promise<WorkspaceDto> {
    return WorkspaceDto.from(await this.workspaceAccess.getWorkspace(workspaceId, access));
  }

  @Patch()
  @RequirePermission(WorkspacePermission.ManageWorkspace)
  @ApiOperation({ summary: 'Rename a workspace' })
  @ApiOkResponse({ type: WorkspaceDto })
  async rename(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: RenameWorkspaceDto,
    @CurrentWorkspaceAccess() access: ResolvedRole,
    @CurrentActor() actor: Actor,
  ): Promise<WorkspaceDto> {
    return WorkspaceDto.from(await this.workspaces.rename(workspaceId, body.name, access, actor));
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
