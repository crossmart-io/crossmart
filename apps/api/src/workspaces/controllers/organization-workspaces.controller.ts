import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspacesService } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { CreateWorkspaceDto } from '../dto/workspace-input.dto.js';
import { WorkspaceDto } from '../dto/workspace.dto.js';
import {
  ORGANIZATION_ID_PARAM,
  ORGANIZATION_WORKSPACES_ROUTE,
  WORKSPACES_TAG,
} from '../workspaces.constants.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';

@ApiTags(WORKSPACES_TAG)
@ApiCookieAuth()
@Controller(ORGANIZATION_WORKSPACES_ROUTE)
export class OrganizationWorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a workspace',
    description:
      'For owners of a workspace in the organization, such as one per client or brand. You own ' +
      'the new workspace. Refused (402) past the plan’s workspace limit.',
  })
  @ApiCreatedResponse({ type: WorkspaceDto })
  @ApiPlanLimitResponse()
  async create(
    @Param(ORGANIZATION_ID_PARAM, ParseUUIDPipe) organizationId: string,
    @Body() body: CreateWorkspaceDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<WorkspaceDto> {
    const { userId } = requireUser(principal);
    return WorkspaceDto.from(await this.workspaces.create(organizationId, userId, body));
  }
}
