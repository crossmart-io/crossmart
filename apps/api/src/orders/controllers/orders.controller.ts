import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService, WorkspacePermission } from '@crossmart/core';
import { WORKSPACE_ID_PARAM } from '../../auth/auth.constants.js';
import { RequirePermission } from '../../auth/decorators/require-permission.decorator.js';
import { ListOrdersQueryDto } from '../dto/list-orders-query.dto.js';
import { OrderDetailDto, OrderPageDto } from '../dto/order.dto.js';
import { ORDER_ID_PARAM, ORDER_PATH, ORDERS_ROUTE, ORDERS_TAG } from '../orders.constants.js';

@ApiTags(ORDERS_TAG)
@Controller(ORDERS_ROUTE)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({
    summary: 'Orders from every connected store, newest first',
    description: 'Orders hold no buyer details. Each line shows the stock it holds.',
  })
  @ApiOkResponse({ type: OrderPageDto })
  async list(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Query() query: ListOrdersQueryDto,
  ): Promise<OrderPageDto> {
    return OrderPageDto.from(await this.orders.list(workspaceId, query));
  }

  @Get(ORDER_PATH)
  @RequirePermission(WorkspacePermission.ViewWorkspace)
  @ApiOperation({ summary: 'One order with its lines and the stock each holds' })
  @ApiOkResponse({ type: OrderDetailDto })
  async get(
    @Param(WORKSPACE_ID_PARAM, ParseUUIDPipe) workspaceId: string,
    @Param(ORDER_ID_PARAM, ParseUUIDPipe) orderId: string,
  ): Promise<OrderDetailDto> {
    return OrderDetailDto.from(await this.orders.get(workspaceId, orderId));
  }
}
