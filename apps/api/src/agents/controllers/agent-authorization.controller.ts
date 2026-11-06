import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiCookieAuth, ApiNoContentResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { WorkspaceAccessService } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { AuthService } from '../../auth/services/auth.service.js';
import {
  AGENT_AUTHORIZATION_ROUTE,
  AGENT_WORKSPACE_ROUTE,
  AGENTS_TAG,
} from '../agents.constants.js';
import { PickAgentWorkspaceDto } from '../dto/pick-agent-workspace.dto.js';

/** The step of an agent's OAuth authorization where the user picks its workspace (ADR 0019). */
@ApiTags(AGENTS_TAG)
@ApiCookieAuth()
@Controller(AGENT_AUTHORIZATION_ROUTE)
export class AgentAuthorizationController {
  constructor(
    private readonly auth: AuthService,
    private readonly workspaceAccess: WorkspaceAccessService,
  ) {}

  @Post(AGENT_WORKSPACE_ROUTE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Pick the workspace for the agent being authorized',
    description:
      'Called by the web app before it continues the OAuth flow. The agent will only ever act ' +
      'in this workspace, within your role there.',
  })
  @ApiNoContentResponse()
  async pickWorkspace(
    @Body() { workspaceId }: PickAgentWorkspaceDto,
    @CurrentPrincipal() principal: Principal,
    @Req() request: Request,
  ): Promise<void> {
    const { userId } = requireUser(principal);
    if (!(await this.workspaceAccess.findRole(workspaceId, userId))) {
      throw new NotFoundException('Workspace not found');
    }
    if (!(await this.auth.pickAgentWorkspace(request.headers, workspaceId))) {
      throw new UnauthorizedException();
    }
  }
}
