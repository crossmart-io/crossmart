import { Controller, Get, Param } from '@nestjs/common';
import { ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingEditorService, WorkspacePermission } from '@crossmart/core';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import {
  LISTING_EDITOR_PATH,
  LISTINGS_TAG,
  PRODUCT_CHANNELS_ROUTE,
} from '../listings.constants.js';
import { ListingEditorDto } from '../dto/listing-editor.dto.js';
import { ProductChannelParamsDto } from '../dto/product-channel-params.dto.js';

/** One product's listing on one store, as the shared listing editor reads it. */
@ApiTags(LISTINGS_TAG)
@Controller(PRODUCT_CHANNELS_ROUTE)
export class ListingEditorController {
  constructor(private readonly editors: ListingEditorService) {}

  @Get(LISTING_EDITOR_PATH)
  @RequirePermission(WorkspacePermission.ViewChannels)
  @ApiOperation({
    summary: 'The product’s listing on one store, for the listing editor',
    description:
      'Every field (title, description, tags, images, visibility, and each variant’s price and ' +
      'compare-at price) with the product’s value, the store’s override (null when it follows ' +
      'the product) and the value the store gets, plus the stock limits, category, a summary ' +
      'of the item specifics and the display state. Revert one field with `PATCH …/override`.',
  })
  @ApiOkResponse({ type: ListingEditorDto })
  @ApiNotFoundResponse({ description: 'The product or the store is not in the workspace' })
  async get(@Param() target: ProductChannelParamsDto): Promise<ListingEditorDto> {
    const { workspaceId, productId, connectionId } = target;
    return ListingEditorDto.from(await this.editors.get(workspaceId, productId, connectionId));
  }
}
