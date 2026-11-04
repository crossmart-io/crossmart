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
import {
  type Actor,
  ConnectionRulesService,
  PricingPreviewService,
  SelectionApplier,
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
} from '../listings.constants.js';
import { PricingPreviewDto, PricingPreviewRequestDto } from '../dto/price-resolution.dto.js';
import { UpdatePricingDto } from '../dto/pricing-rule.dto.js';

/** A store's pricing rule, applied at once, with a preview on a real product. */
@ApiTags(LISTINGS_TAG)
@Controller(CONNECTION_ROUTE)
export class ChannelRulesController {
  constructor(
    private readonly rules: ConnectionRulesService,
    private readonly pricingPreview: PricingPreviewService,
    private readonly applier: SelectionApplier,
  ) {}

  @Put(PRICING_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Set the connection’s pricing rule',
    description:
      'The store’s listings get the new prices at once. A null rule sends catalog prices.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  async updatePricing(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdatePricingDto,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    const rule = body.rule ? body.rule.toRule() : null;
    const saved = await this.rules.updatePricing(workspaceId, connectionId, rule, actor);
    await this.applier.applyPricing(workspaceId, connectionId);
    return ChannelConnectionDto.from(saved);
  }

  @Post(PRICING_PREVIEW_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ViewChannels)
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
}
