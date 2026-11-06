import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  type Actor,
  type AgentConnectionViewer,
  AgentConnectionsService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  AGENT_CONNECTION_ID_PARAM,
  AGENT_CONNECTIONS_ROUTE,
  AGENTS_TAG,
} from '../agents.constants.js';
import { CurrentAgentConnectionViewer } from '../decorators/agent-connection-viewer.decorator.js';
import { AgentConnectionDto } from '../dto/agent-connection.dto.js';

@ApiTags(AGENTS_TAG)
@ApiCookieAuth()
@Controller(AGENT_CONNECTIONS_ROUTE)
@RequirePermission(WorkspacePermission.ViewWorkspace)
export class AgentConnectionsController {
  constructor(private readonly connections: AgentConnectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'AI agents connected to the workspace',
    description:
      'Your own connections, or every member’s if you may manage API keys. Signed-in users only.',
  })
  @ApiOkResponse({ type: [AgentConnectionDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentAgentConnectionViewer() viewer: AgentConnectionViewer,
  ): Promise<AgentConnectionDto[]> {
    const connections = await this.connections.list(workspaceId, viewer);
    return connections.map((connection) => AgentConnectionDto.from(connection));
  }

  @Delete(`:${AGENT_CONNECTION_ID_PARAM}`)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Disconnect an agent',
    description: 'Revokes its tokens at once. The agent must be authorized again to come back.',
  })
  @ApiNoContentResponse()
  revoke(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(AGENT_CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @CurrentAgentConnectionViewer() viewer: AgentConnectionViewer,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    return this.connections.revoke(workspaceId, connectionId, viewer, actor);
  }
}
