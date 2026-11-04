import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, BulkProductActionsService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { CATALOG_TAG, PRODUCT_BULK_ACTIONS_ROUTE } from '../catalog.constants.js';
import { BulkProductActionDto, BulkProductResultDto } from '../dto/bulk-product-action.dto.js';

@ApiTags(CATALOG_TAG)
@Controller(PRODUCT_BULK_ACTIONS_ROUTE)
export class ProductBulkActionsController {
  constructor(private readonly bulkActions: BulkProductActionsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.EditProducts)
  @ApiOperation({
    summary: 'Change many products at once',
    description:
      'Set a status, add or remove tags, move every variant price by a percentage, or delete. ' +
      'Each action runs as one statement, scoped to the workspace.',
  })
  @ApiOkResponse({ type: BulkProductResultDto })
  async apply(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Body() body: BulkProductActionDto,
    @CurrentActor() actor: Actor,
  ): Promise<BulkProductResultDto> {
    return BulkProductResultDto.from(
      await this.bulkActions.apply(workspaceId, body.productIds, body.toChange(), actor),
    );
  }
}
