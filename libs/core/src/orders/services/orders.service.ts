import { Injectable, NotFoundException } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type { OrderDetail, OrderListQuery, OrderPage } from '../entities/order-views.js';
import { toOrderDetail, toOrderSummary } from '../mappers/order.mapper.js';
import { ORDER_NOT_FOUND } from '../orders.constants.js';
import { OrderRepository } from '../repositories/order.repository.js';

/** Reads the workspace's orders. Orders are written only by ingestion, never by hand. */
@Injectable()
export class OrdersService {
  constructor(private readonly orders: OrderRepository) {}

  async list(workspaceId: string, query: OrderListQuery): Promise<OrderPage> {
    const { rows, nextCursor, total } = toCountedPage(
      await this.orders.listPage(workspaceId, query),
      query.limit,
    );
    return { items: rows.map((record) => toOrderSummary(record)), nextCursor, total };
  }

  async get(workspaceId: string, orderId: string): Promise<OrderDetail> {
    const record = await this.orders.findDetail(workspaceId, orderId);
    if (!record) throw new NotFoundException(ORDER_NOT_FOUND);
    return toOrderDetail(record);
  }
}
