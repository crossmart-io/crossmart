import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type Actor, StoreMembershipService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { StoreProductsDto, StoreProductsResultDto } from '../dto/store-membership.dto.js';
import {
  ADD_PRODUCTS_PATH,
  CONNECTION_ID_PARAM,
  CONNECTION_ROUTE,
  LISTINGS_TAG,
  REMOVE_PRODUCTS_PATH,
} from '../listings.constants.js';
import { ApiPlanLimitResponse } from '../../entitlements/decorators/api-plan-limit-response.decorator.js';

/** Adding many products to a store, or removing them, as the products table does. */
@ApiTags(LISTINGS_TAG)
@Controller(CONNECTION_ROUTE)
export class StoreProductsController {
  constructor(private readonly membership: StoreMembershipService) {}

  @Post(ADD_PRODUCTS_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Add products to the store',
    description:
      'They stay until removed and are published at once. Refused (402) without changes when ' +
      'the plan has no room for the active listings they would add.',
  })
  @ApiOkResponse({ type: StoreProductsResultDto })
  @ApiPlanLimitResponse()
  async add(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: StoreProductsDto,
    @CurrentActor() actor: Actor,
  ): Promise<StoreProductsResultDto> {
    await this.membership.add({ workspaceId, connectionId, productIds: body.productIds }, actor);
    return StoreProductsResultDto.of(body.productIds.length);
  }

  @Post(REMOVE_PRODUCTS_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.EditListings)
  @ApiOperation({
    summary: 'Remove products from the store',
    description: 'They are delisted at once, and the automatic rule leaves them out.',
  })
  @ApiOkResponse({ type: StoreProductsResultDto })
  async remove(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(CONNECTION_ID_PARAM, ParseUUIDPipe) connectionId: string,
    @Body() body: StoreProductsDto,
    @CurrentActor() actor: Actor,
  ): Promise<StoreProductsResultDto> {
    await this.membership.remove({ workspaceId, connectionId, productIds: body.productIds }, actor);
    return StoreProductsResultDto.of(body.productIds.length);
  }
}
