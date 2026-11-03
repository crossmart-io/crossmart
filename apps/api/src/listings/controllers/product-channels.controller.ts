import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  ListingOverridesService,
  ProductChannelsService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  LISTINGS_TAG,
  OVERRIDE_PATH,
  PRODUCT_CHANNELS_ROUTE,
  PRODUCT_ID_PARAM,
} from '../listings.constants.js';
import { ListingOverrideDto } from '../dto/listing-override.dto.js';
import { ProductChannelParamsDto } from '../dto/product-channel-params.dto.js';
import { ProductChannelDto } from '../dto/product-channel.dto.js';

/** A product on each connected channel, and what it shows differently there. */
@ApiTags(LISTINGS_TAG)
@Controller(PRODUCT_CHANNELS_ROUTE)
export class ProductChannelsController {
  constructor(
    private readonly channels: ProductChannelsService,
    private readonly overrides: ListingOverridesService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'The product on each connected channel',
    description:
      'Listing status, channel prices with their explanation, shown stock and overrides.',
  })
  @ApiOkResponse({ type: [ProductChannelDto] })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(PRODUCT_ID_PARAM, ParseUUIDPipe) productId: string,
  ): Promise<ProductChannelDto[]> {
    const views = await this.channels.list(workspaceId, productId);
    return views.map((view) => ProductChannelDto.from(view));
  }

  @Put(OVERRIDE_PATH)
  @RequirePermission(WorkspacePermission.EditCatalog)
  @ApiOperation({
    summary: 'Override the product on one channel',
    description:
      'Replaces the overrides: absent or null fields follow the product. When the channel ' +
      'already lists the product, an update is queued.',
  })
  @ApiOkResponse({ type: ProductChannelDto })
  async saveOverride(
    @Param() target: ProductChannelParamsDto,
    @Body() body: ListingOverrideDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.overrides.save(target, body.toInput(), actor);
    return this.channelView(target);
  }

  @Delete(OVERRIDE_PATH)
  @RequirePermission(WorkspacePermission.EditCatalog)
  @ApiOperation({ summary: 'Remove the product’s overrides on one channel' })
  @ApiOkResponse({ type: ProductChannelDto })
  async clearOverride(
    @Param() target: ProductChannelParamsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.overrides.clear(target, actor);
    return this.channelView(target);
  }

  private async channelView(target: ProductChannelParamsDto): Promise<ProductChannelDto> {
    const { workspaceId, productId, connectionId } = target;
    return ProductChannelDto.from(await this.channels.get(workspaceId, productId, connectionId));
  }
}
