import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AgentClientsService, WorkspaceAccessService } from '@crossmart/core';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import { AuthService } from '../../auth/services/auth.service.js';
import {
  AGENT_AUTHORIZATION_ROUTE,
  AGENT_CLIENT_ROUTE,
  AGENT_WORKSPACE_ROUTE,
  AGENTS_TAG,
} from '../agents.constants.js';
import { AgentClientQueryDto } from '../dto/agent-client-query.dto.js';
import { AgentClientDto } from '../dto/agent-client.dto.js';
import { PickAgentWorkspaceDto } from '../dto/pick-agent-workspace.dto.js';

/**
 * The steps of an agent's OAuth authorization the web app drives (ADR 0019): who the agent is,
 * and picking its workspace.
 */
@ApiTags(AGENTS_TAG)
@ApiCookieAuth()
@Controller(AGENT_AUTHORIZATION_ROUTE)
export class AgentAuthorizationController {
  constructor(
    private readonly auth: AuthService,
    private readonly workspaceAccess: WorkspaceAccessService,
    private readonly agentClients: AgentClientsService,
  ) {}

  @Get(AGENT_CLIENT_ROUTE)
  @ApiOperation({
    summary: 'The agent asking for access',
    description:
      'Its name, and what of it Crossmart could verify: the host of a Client ID Metadata ' +
      'Document, or nothing for an agent that registered itself. Signed-in users only.',
  })
  @ApiOkResponse({ type: AgentClientDto })
  @ApiNotFoundResponse({ description: 'No such agent, or it is disabled' })
  async findClient(
    @Query() { clientId }: AgentClientQueryDto,
    @CurrentPrincipal() principal: Principal,
  ): Promise<AgentClientDto> {
    requireUser(principal);
    return AgentClientDto.from(await this.agentClients.findProfile(clientId));
  }

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
