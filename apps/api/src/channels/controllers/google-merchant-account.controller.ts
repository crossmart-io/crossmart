import { Body, Controller, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, GoogleMerchantSetupService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CHANNEL_CONNECTIONS_ROUTE,
  CHANNELS_TAG,
  CONNECTION_ID_PARAM,
  GOOGLE_LISTING_SETUP_PATH,
} from '../channels.constants.js';
import { ChannelConnectionDto } from '../dto/channel-connection.dto.js';
import { UpdateGoogleListingSetupDto } from '../dto/update-google-listing-setup.dto.js';

/** What a Google Merchant Center connection needs before it can list. */
@ApiTags(CHANNELS_TAG)
@Controller(CHANNEL_CONNECTIONS_ROUTE)
export class GoogleMerchantAccountController {
  constructor(private readonly setup: GoogleMerchantSetupService) {}

  @Put(GOOGLE_LISTING_SETUP_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Set where a Google Merchant Center connection lists',
    description:
      'The country listings target (their currency and language follow) and each product’s ' +
      'page address. Saving creates the Merchant Center API data source for a new country.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async saveListingSetup(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdateGoogleListingSetupDto,
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
}
