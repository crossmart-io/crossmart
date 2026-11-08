import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { OUTSIDE_AGENT_CHANGES_PEOPLE_ONLY } from '../../agent-proposals/agent-proposals.constants.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { PrincipalKind } from '../../auth/enums/principal-kind.enum.js';
import { toActor } from '../../auth/principal.utils.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceAccess } from '../../auth/decorators/workspace-access.decorator.js';
import { DeleteWorkspaceDto } from '../dto/delete-workspace.dto.js';
import { UpdateWorkspaceDto } from '../dto/workspace-input.dto.js';
import { WorkspaceDto } from '../dto/workspace.dto.js';
import { WORKSPACE_ROUTE, WORKSPACES_TAG } from '../workspaces.constants.js';
import { AllowedWhileReadOnly } from '../../billing/decorators/allowed-while-read-only.decorator.js';

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
  @ApiOperation({
    summary: "Rename a workspace, set its time zone, or say whether agents' changes need approval",
  })
  @ApiOkResponse({ type: WorkspaceDto })
  async update(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: UpdateWorkspaceDto,
    @CurrentWorkspaceAccess() access: ResolvedRole,
    @CurrentPrincipal() principal: Principal,
  ): Promise<WorkspaceDto> {
    if (body.outsideAgentChanges !== undefined && principal.kind !== PrincipalKind.User) {
      throw new ForbiddenException(OUTSIDE_AGENT_CHANGES_PEOPLE_ONLY);
    }
    const { name, timeZone, outsideAgentChanges } = body;
    const changes = { name, timeZone, outsideAgentChanges };
    const actor = toActor(principal);
    return WorkspaceDto.from(await this.workspaces.update(workspaceId, changes, access, actor));
  }

  @Delete()
  @AllowedWhileReadOnly()
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
