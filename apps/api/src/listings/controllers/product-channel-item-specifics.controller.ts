import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, ListingItemSpecificsService, WorkspacePermission } from '@crossmart/core';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  ITEM_SPECIFICS_PATH,
  LISTINGS_TAG,
  PRODUCT_CHANNELS_ROUTE,
} from '../listings.constants.js';
import { ListingItemSpecificsDto, SaveItemSpecificsDto } from '../dto/item-specifics.dto.js';
import { ProductChannelParamsDto } from '../dto/product-channel-params.dto.js';

/** The item specifics of a product's listing, on channels whose categories have them (eBay). */
@ApiTags(LISTINGS_TAG)
@Controller(PRODUCT_CHANNELS_ROUTE)
export class ProductChannelItemSpecificsController {
  constructor(private readonly itemSpecifics: ListingItemSpecificsService) {}

  @Get(ITEM_SPECIFICS_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Get the listing’s item specifics',
    description:
      'The item specifics the listing’s channel category asks for (none until it has a ' +
      'category), with the values set on the listing.',
  })
  @ApiOkResponse({ type: ListingItemSpecificsDto })
  async get(@Param() target: ProductChannelParamsDto): Promise<ListingItemSpecificsDto> {
    return ListingItemSpecificsDto.from(await this.itemSpecifics.get(target));
  }

  @Put(ITEM_SPECIFICS_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Set the listing’s item specifics',
    description:
      'Replaces the item specifics set on the listing. They are sent on publish ahead of the ' +
      'ones Crossmart derives (such as Brand from the vendor). The listing is sent again when ' +
      'the channel holds it or its last publish failed.',
  })
  @ApiOkResponse({ type: ListingItemSpecificsDto })
  async save(
    @Param() target: ProductChannelParamsDto,
    @Body() body: SaveItemSpecificsDto,
    @CurrentActor() actor: Actor,
  ): Promise<ListingItemSpecificsDto> {
    await this.itemSpecifics.save(target, body.itemSpecifics, actor);
    return ListingItemSpecificsDto.from(await this.itemSpecifics.get(target));
  }
}
