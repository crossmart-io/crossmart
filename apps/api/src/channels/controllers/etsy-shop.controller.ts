import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, EtsyShopSetupService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CHANNEL_CONNECTIONS_ROUTE,
  CHANNELS_TAG,
  CONNECTION_ID_PARAM,
  ETSY_LISTING_SETUP_PATH,
  ETSY_SHOP_REFRESH_PATH,
} from '../channels.constants.js';
import { ChannelConnectionDto } from '../dto/channel-connection.dto.js';
import { UpdateEtsyListingSetupDto } from '../dto/update-etsy-listing-setup.dto.js';

/** What an Etsy connection needs before it can list: item details and profiles. */
@ApiTags(CHANNELS_TAG)
@Controller(CHANNEL_CONNECTIONS_ROUTE)
export class EtsyShopController {
  constructor(private readonly setup: EtsyShopSetupService) {}

  @Put(ETSY_LISTING_SETUP_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Set an Etsy connection’s listing setup',
    description:
      'Who made the items, when, whether they are supplies, and the shop’s shipping and ' +
      'processing profiles every listing uses. Etsy requires all of them for physical listings.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async saveListingSetup(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdateEtsyListingSetupDto,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    const saved = await this.setup.saveListingSetup(
      workspaceId,
      connectionId,
      body.toInput(),
      actor,
    );
    return ChannelConnectionDto.from(saved);
  }

  @Post(ETSY_SHOP_REFRESH_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Read an Etsy shop and its profiles again',
    description:
      'After the merchant creates or edits shipping or processing profiles on Etsy. The listing setup is kept.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async refreshShop(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
  ): Promise<ChannelConnectionDto> {
    return ChannelConnectionDto.from(await this.setup.refreshShop(workspaceId, connectionId));
  }
}
