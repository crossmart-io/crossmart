import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceAccessService, WorkspacePermission } from '@crossmart/core';
import type { WorkspaceRole } from '@crossmart/database';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CurrentWorkspaceRole } from '../../auth/decorators/workspace-role.decorator.js';
import { WorkspaceMemberDto } from '../dto/workspace-member.dto.js';
import { WorkspaceDto } from '../dto/workspace.dto.js';
import { MEMBERS_ROUTE, WORKSPACE_ROUTE, WORKSPACES_TAG } from '../workspaces.constants.js';

@ApiTags(WORKSPACES_TAG)
@Controller(WORKSPACE_ROUTE)
export class WorkspacesController {
  constructor(private readonly workspaceAccess: WorkspaceAccessService) {}

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

  @Get(MEMBERS_ROUTE)
  @RequirePermission(WorkspacePermission.ViewMembers)
  @ApiOperation({ summary: 'The members of a workspace' })
  @ApiOkResponse({ type: [WorkspaceMemberDto] })
  async listMembers(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<WorkspaceMemberDto[]> {
    const members = await this.workspaceAccess.listMembers(workspaceId);
    return members.map((member) => WorkspaceMemberDto.from(member));
  }
}
