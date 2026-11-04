import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  ChannelListingsService,
  ChannelSyncService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CONNECTION_ID_PARAM,
  CONNECTION_ROUTE,
  LISTINGS_PATH,
  LISTINGS_TAG,
  SYNC_PATH,
} from '../listings.constants.js';
import {
  ChannelListingPageDto,
  ListChannelListingsQueryDto,
  SyncRequestResultDto,
} from '../dto/channel-listing.dto.js';

/** Publishing a connection's selected products, and the listings it holds. */
@ApiTags(LISTINGS_TAG)
@Controller(CONNECTION_ROUTE)
export class ChannelSyncController {
  constructor(
    private readonly sync: ChannelSyncService,
    private readonly listings: ChannelListingsService,
  ) {}

  @Post(SYNC_PATH)
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Publish the selected products and sync the connection',
    description:
      'Queues every selected product to be published (or updated when the channel has it) ' +
      'and every listing that is no longer selected to be delisted. Jobs run in the background; ' +
      'follow them in the listings.',
  })
  @ApiAcceptedResponse({ type: SyncRequestResultDto })
  async requestSync(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @CurrentActor() actor: Actor,
  ): Promise<SyncRequestResultDto> {
    return SyncRequestResultDto.from(await this.sync.requestSync(workspaceId, connectionId, actor));
  }

  @Get(LISTINGS_PATH)
  @RequirePermission(WorkspacePermission.ViewChannels)
  @ApiOperation({ summary: 'The connection’s listings, most recently changed first' })
  @ApiOkResponse({ type: ChannelListingPageDto })
  async listListings(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Query() query: ListChannelListingsQueryDto,
  ): Promise<ChannelListingPageDto> {
    return ChannelListingPageDto.from(await this.listings.list(workspaceId, connectionId, query));
  }
}
