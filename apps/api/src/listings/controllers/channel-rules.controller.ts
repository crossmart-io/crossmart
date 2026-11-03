import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  ConnectionRulesService,
  PricingPreviewService,
  ProductSelectionService,
  ChannelConnectionsService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ChannelConnectionDto } from '../../channels/dto/channel-connection.dto.js';
import {
  CONNECTION_ID_PARAM,
  CONNECTION_ROUTE,
  LISTINGS_TAG,
  PRICING_PATH,
  PRICING_PREVIEW_PATH,
  SELECTION_PATH,
  SELECTION_PREVIEW_PATH,
} from '../listings.constants.js';
import { PricingPreviewDto, PricingPreviewRequestDto } from '../dto/price-resolution.dto.js';
import { UpdatePricingDto } from '../dto/pricing-rule.dto.js';
import {
  SelectionPreviewDto,
  SelectionPreviewQueryDto,
  UpdateProductSelectionDto,
} from '../dto/product-selection.dto.js';

/** A connection's pricing rule and product selection, with previews of both. */
@ApiTags(LISTINGS_TAG)
@Controller(CONNECTION_ROUTE)
export class ChannelRulesController {
  constructor(
    private readonly rules: ConnectionRulesService,
    private readonly pricingPreview: PricingPreviewService,
    private readonly selection: ProductSelectionService,
    private readonly connections: ChannelConnectionsService,
  ) {}

  @Put(PRICING_PATH)
  @RequirePermission(WorkspacePermission.ManageWorkspace)
  @ApiOperation({
    summary: 'Set the connection’s pricing rule',
    description: 'Listings get the new prices on their next sync. A null rule removes it.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async updatePricing(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdatePricingDto,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    const rule = body.rule ? body.rule.toRule() : null;
    return ChannelConnectionDto.from(
      await this.rules.updatePricing(workspaceId, connectionId, rule, actor),
    );
  }

  @Post(PRICING_PREVIEW_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Price a real product with a rule, saved or not',
    description: 'Without `productId`, the first product of the selection is priced.',
  })
  @ApiOkResponse({ type: PricingPreviewDto })
  async previewPricing(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: PricingPreviewRequestDto,
  ): Promise<PricingPreviewDto> {
    const rule = body.rule ? body.rule.toRule() : null;
    return PricingPreviewDto.from(
      await this.pricingPreview.preview(workspaceId, connectionId, rule, body.productId),
    );
  }

  @Put(SELECTION_PATH)
  @RequirePermission(WorkspacePermission.ManageWorkspace)
  @ApiOperation({
    summary: 'Choose which products the connection lists',
    description: '“Sync now” publishes newly selected products and delists the rest.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async updateSelection(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdateProductSelectionDto,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    const rule = body.rule ? body.rule.toRule() : null;
    return ChannelConnectionDto.from(
      await this.rules.updateSelection(workspaceId, connectionId, rule, actor),
    );
  }

  @Post(SELECTION_PREVIEW_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({ summary: 'The products a selection lists, with counts, saved or not' })
  @ApiOkResponse({ type: SelectionPreviewDto })
  async previewSelection(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdateProductSelectionDto,
    @Query() query: SelectionPreviewQueryDto,
  ): Promise<SelectionPreviewDto> {
    await this.connections.get(workspaceId, connectionId);
    const rule = body.rule ? body.rule.toRule() : null;
    return SelectionPreviewDto.from(await this.selection.preview(workspaceId, rule, query));
  }
}
