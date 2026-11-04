import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  type Actor,
  InventoryService,
  StockAdjustmentService,
  WorkspacePermission,
} from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { CurrentActor } from '../../auth/decorators/current-actor.decorator.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { AdjustStockDto } from '../dto/adjust-stock.dto.js';
import { InventoryItemDto, InventoryPageDto } from '../dto/inventory-item.dto.js';
import { InventoryMovementPageDto } from '../dto/inventory-movement.dto.js';
import { ListInventoryQueryDto } from '../dto/list-inventory-query.dto.js';
import { ListMovementsQueryDto } from '../dto/list-movements-query.dto.js';
import {
  ADJUSTMENTS_PATH,
  INVENTORY_ITEM_ID_PARAM,
  INVENTORY_ITEMS_ROUTE,
  INVENTORY_TAG,
  MOVEMENTS_PATH,
} from '../inventory.constants.js';

@ApiTags(INVENTORY_TAG)
@Controller(INVENTORY_ITEMS_ROUTE)
export class InventoryItemsController {
  constructor(
    private readonly inventory: InventoryService,
    private readonly adjustments: StockAdjustmentService,
  ) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewInventory)
  @ApiOperation({ summary: 'Stock of every variant, by product title' })
  @ApiOkResponse({ type: InventoryPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListInventoryQueryDto,
  ): Promise<InventoryPageDto> {
    return InventoryPageDto.from(await this.inventory.list(workspaceId, query));
  }

  @Post(ADJUSTMENTS_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(WorkspacePermission.EditInventory)
  @ApiOperation({
    summary: 'Adjust the stock on hand of a variant',
    description:
      'Adds or removes units, or sets the counted stock, and records the change in the ledger ' +
      'with its reason and author. Reserved units are not changed.',
  })
  @ApiOkResponse({ type: InventoryItemDto })
  async adjust(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(INVENTORY_ITEM_ID_PARAM, ParseUUIDPipe) inventoryItemId: string,
    @Body() body: AdjustStockDto,
    @CurrentActor() actor: Actor,
  ): Promise<InventoryItemDto> {
    return InventoryItemDto.from(
      await this.adjustments.adjust(workspaceId, inventoryItemId, body.toAdjustment(actor)),
    );
  }

  @Get(MOVEMENTS_PATH)
  @RequirePermission(WorkspacePermission.ViewInventory)
  @ApiOperation({ summary: 'Stock history of a variant, newest first' })
  @ApiOkResponse({ type: InventoryMovementPageDto })
  async history(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(INVENTORY_ITEM_ID_PARAM, ParseUUIDPipe) inventoryItemId: string,
    @Query() query: ListMovementsQueryDto,
  ): Promise<InventoryMovementPageDto> {
    return InventoryMovementPageDto.from(
      await this.inventory.history(workspaceId, inventoryItemId, query),
    );
  }
}
