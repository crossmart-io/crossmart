import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  ListingCategoryService,
  ProductChannelsService,
  WorkspacePermission,
} from '@crossmart/core';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  CATEGORY_PATH,
  CATEGORY_SUGGESTIONS_PATH,
  LISTINGS_TAG,
  PRODUCT_CHANNELS_ROUTE,
} from '../listings.constants.js';
import {
  CategorySuggestionsQueryDto,
  ChannelCategoryDto,
  ChooseChannelCategoryDto,
} from '../dto/channel-category.dto.js';
import { ProductChannelParamsDto } from '../dto/product-channel-params.dto.js';
import { ProductChannelDto } from '../dto/product-channel.dto.js';

/** The channel category a product is listed in, on channels that have categories (eBay). */
@ApiTags(LISTINGS_TAG)
@Controller(PRODUCT_CHANNELS_ROUTE)
export class ProductChannelCategoryController {
  constructor(
    private readonly categories: ListingCategoryService,
    private readonly channels: ProductChannelsService,
  ) {}

  @Get(CATEGORY_SUGGESTIONS_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Suggest channel categories for the product',
    description: 'Searches the channel’s categories for `search`, or for the product’s title.',
  })
  @ApiOkResponse({ type: [ChannelCategoryDto] })
  async suggest(
    @Param() target: ProductChannelParamsDto,
    @Query() query: CategorySuggestionsQueryDto,
  ): Promise<ChannelCategoryDto[]> {
    const categories = await this.categories.suggest(target, query.search);
    return categories.map((category) => ChannelCategoryDto.from(category));
  }

  @Put(CATEGORY_PATH)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Choose the product’s channel category',
    description:
      'Null lets the next publish pick the channel’s best match. When the channel already ' +
      'lists the product, an update is queued.',
  })
  @ApiOkResponse({ type: ProductChannelDto })
  async choose(
    @Param() target: ProductChannelParamsDto,
    @Body() body: ChooseChannelCategoryDto,
    @CurrentActor() actor: Actor,
  ): Promise<ProductChannelDto> {
    await this.categories.choose(target, body.category ?? null, actor);
    const { workspaceId, productId, connectionId } = target;
    return ProductChannelDto.from(await this.channels.get(workspaceId, productId, connectionId));
  }
}
