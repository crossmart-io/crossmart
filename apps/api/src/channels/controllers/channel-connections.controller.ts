import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  type Actor,
  ChannelAuthorizationService,
  ChannelConnectionsService,
  WorkspacePermission,
  ChannelListingsService,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { CurrentPrincipal } from '../../auth/decorators/current-principal.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import type { Principal } from '../../auth/entities/principal.js';
import { requireUser } from '../../auth/principal.utils.js';
import {
  AUTHORIZATIONS_PATH,
  CHANNEL_CONNECTIONS_ROUTE,
  CHANNELS_TAG,
  CONNECTION_ID_PARAM,
  DISCONNECT_PATH,
} from '../channels.constants.js';
import { ChannelConnectRedirectDto } from '../dto/channel-connect-redirect.dto.js';
import { ChannelConnectionDto } from '../dto/channel-connection.dto.js';
import { StartAuthorizationDto, StartedAuthorizationDto } from '../dto/start-authorization.dto.js';

@ApiTags(CHANNELS_TAG)
@ApiExtraModels(ChannelConnectRedirectDto)
@Controller(CHANNEL_CONNECTIONS_ROUTE)
export class ChannelConnectionsController {
  constructor(
    private readonly connections: ChannelConnectionsService,
    private readonly authorizations: ChannelAuthorizationService,
    private readonly listings: ChannelListingsService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewChannels)
  @ApiOperation({ summary: 'Channel accounts connected to the workspace, in connection order' })
  @ApiOkResponse({ type: [ChannelConnectionDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
  ): Promise<ChannelConnectionDto[]> {
    const views = await this.connections.list(workspaceId);
    const failed = await this.listings.failedCounts(workspaceId);
    return views.map((view) => ChannelConnectionDto.from(view, failed.get(view.id) ?? 0));
  }

  @Post(AUTHORIZATIONS_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Start connecting a channel account',
    description:
      'Returns the URL to send the merchant to. After they approve the app, the channel ' +
      'redirects to the API, which stores the connection and sends them back to the web app’s ' +
      'Channels page with the parameters of `ChannelConnectRedirectDto`. Needs a signed-in user.',
  })
  @ApiCreatedResponse({ type: StartedAuthorizationDto })
  startAuthorization(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @CurrentPrincipal() principal: Principal,
    @Body() body: StartAuthorizationDto,
  ): StartedAuthorizationDto {
    const { userId } = requireUser(principal);
    return StartedAuthorizationDto.from(this.authorizations.start(workspaceId, userId, body));
  }

  @Get(`:${CONNECTION_ID_PARAM}`)
  @RequirePermission(WorkspacePermission.ViewChannels)
  @ApiOperation({ summary: 'One channel connection' })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
  ): Promise<ChannelConnectionDto> {
    const [view, failed] = await Promise.all([
      this.connections.get(workspaceId, connectionId),
      this.listings.failedCounts(workspaceId),
    ]);
    return ChannelConnectionDto.from(view, failed.get(view.id) ?? 0);
  }

  @Post(DISCONNECT_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Disconnect a channel account',
    description:
      'Revokes Crossmart’s access on the channel (for Shopify, uninstalls the app unless ' +
      'another workspace uses the same store) and wipes the stored credentials. Listings stay.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async disconnect(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    return ChannelConnectionDto.from(
      await this.connections.disconnect(workspaceId, connectionId, actor),
    );
  }
}
