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
  ChannelConnectionsService,
  ProductSelectionService,
  SelectionApplier,
  StoreSelectionService,
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
  SELECTION_PATH,
  SELECTION_PREVIEW_PATH,
} from '../listings.constants.js';
import {
  SelectionPreviewDto,
  SelectionPreviewQueryDto,
  UpdateProductSelectionDto,
} from '../dto/product-selection.dto.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';

/** A store's automatic rule, applied at once, with a preview of what it changes. */
@ApiTags(LISTINGS_TAG)
@Controller(CONNECTION_ROUTE)
export class ChannelSelectionController {
  constructor(
    private readonly stores: StoreSelectionService,
    private readonly selection: ProductSelectionService,
    private readonly connections: ChannelConnectionsService,
    private readonly applier: SelectionApplier,
  ) {}

  @Put(SELECTION_PATH)
  @RequirePermission(WorkspacePermission.ManageChannels)
  @ApiOperation({
    summary: 'Set the store’s automatic rule',
    description:
      'Applies at once: products the rule now adds are published, and products it now drops ' +
      'are delisted. Products added by hand stay; those removed by hand stay out. Refused ' +
      '(402) without saving when the plan has no room for the active listings it would add.',
  })
  @ApiOkResponse({ type: ChannelConnectionDto })
  @ApiPlanLimitResponse()
  async updateSelection(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: UpdateProductSelectionDto,
    @CurrentActor() actor: Actor,
  ): Promise<ChannelConnectionDto> {
    const rule = body.rule ? body.rule.toRule() : null;
    return ChannelConnectionDto.from(
      await this.stores.update({ workspaceId, connectionId }, rule, actor),
    );
  }

  @Post(SELECTION_PREVIEW_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.ViewChannels)
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
    const scope = { workspaceId, connectionId, rule };
    const [preview, impact] = await Promise.all([
      this.selection.preview(scope, query),
      this.applier.impact(scope),
    ]);
    return SelectionPreviewDto.from(preview, impact);
  }
}
