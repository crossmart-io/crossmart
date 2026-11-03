import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChannelProductsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ChannelProductPageDto, ListChannelProductsQueryDto } from '../dto/channel-product.dto.js';
import {
  CHANNEL_PRODUCTS_PATH,
  CONNECTION_ID_PARAM,
  CONNECTION_ROUTE,
  LISTINGS_TAG,
} from '../listings.constants.js';

/** The catalog as one connection sees it: what should be on the channel, and what is. */
@ApiTags(LISTINGS_TAG)
@Controller(CONNECTION_ROUTE)
export class ChannelProductsController {
  constructor(private readonly products: ChannelProductsService) {}

  @Get(CHANNEL_PRODUCTS_PATH)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Every product with its state on the connection',
    description:
      'Each product says whether the selection includes it and whether the channel has it: ' +
      'listed, pending (the next sync publishes it), failed, removing (the next sync delists ' +
      'it) or excluded. Counts per state follow `search`, so they can label filter tabs.',
  })
  @ApiOkResponse({ type: ChannelProductPageDto })
  async listProducts(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Query() query: ListChannelProductsQueryDto,
  ): Promise<ChannelProductPageDto> {
    return ChannelProductPageDto.from(await this.products.list(workspaceId, connectionId, query));
  }
}
