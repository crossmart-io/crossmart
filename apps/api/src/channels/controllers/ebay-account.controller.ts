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
import { type Actor, EbayAccountSetupService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CHANNEL_CONNECTIONS_ROUTE,
  CHANNELS_TAG,
  CONNECTION_ID_PARAM,
  EBAY_LISTING_DEFAULTS_PATH,
  EBAY_POLICIES_DEFAULTS_PATH,
  EBAY_POLICIES_OPT_IN_PATH,
  EBAY_POLICIES_REFRESH_PATH,
} from '../channels.constants.js';
import { ChannelConnectionDto } from '../dto/channel-connection.dto.js';
import { UpdateEbayListingDefaultsDto } from '../dto/ebay-listing-defaults.dto.js';

/** What an eBay connection needs before it can list: defaults, policies and a ship-from. */
@ApiTags(CHANNELS_TAG)
@Controller(CHANNEL_CONNECTIONS_ROUTE)
export class EbayAccountController {
  constructor(private readonly setup: EbayAccountSetupService) {}

  @Put(EBAY_LISTING_DEFAULTS_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Set an eBay connection’s listing defaults',
    description:
      'Business policies, condition and ship-from address for every listing. The address is ' +
      'saved on eBay as the account’s Crossmart inventory location.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async saveListingDefaults(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdateEbayListingDefaultsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    const saved = await this.setup.saveListingDefaults(
      workspaceId,
      connectionId,
      body.toInput(),
      actor,
    );
    return ChannelConnectionDto.from(saved);
  }

  @Post(EBAY_POLICIES_OPT_IN_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Opt an eBay account in to business policies',
    description:
      'eBay may take a few minutes to enable them; refresh the policies once they are created.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async optInToBusinessPolicies(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    return ChannelConnectionDto.from(
      await this.setup.optInToBusinessPolicies(workspaceId, connectionId, actor),
    );
  }

  @Post(EBAY_POLICIES_DEFAULTS_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Create default business policies on an eBay account',
    description:
      'Creates free standard shipping, immediate payment and 30-day return policies on the ' +
      'eBay account (opting it in to business policies first when needed), reads the policies ' +
      'again and chooses the new ones as the listing defaults. Policies that already exist are ' +
      'used as they are, so calling this twice is harmless. Marketplaces without a default ' +
      'shipping service answer 422.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async createDefaultPolicies(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    return ChannelConnectionDto.from(
      await this.setup.createDefaultPolicies(workspaceId, connectionId, actor),
    );
  }

  @Post(EBAY_POLICIES_REFRESH_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Read an eBay account’s business policies again',
    description: 'After the merchant creates or edits policies on eBay. Defaults are kept.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async refreshPolicies(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
  ): Promise<ChannelConnectionDto> {
    return ChannelConnectionDto.from(await this.setup.refreshPolicies(workspaceId, connectionId));
  }
}
