import { Injectable } from '@nestjs/common';
import {
  type CountedRecords,
  SortDirection,
  sortWithTiebreak,
  toPageWindow,
} from '@crossmart/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { OrderListQuery } from '../entities/order-views.js';
import {
  ORDER_DETAIL_INCLUDE,
  ORDER_SUMMARY_INCLUDE,
  type OrderDetailRecord,
  type OrderSummaryRecord,
} from './order.queries.js';

const INSENSITIVE = 'insensitive' as const;

/** The workspace's orders, for the orders table and order pages. */
@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listPage(
    workspaceId: string,
    query: OrderListQuery,
  ): Promise<CountedRecords<OrderSummaryRecord>> {
    const where: Prisma.OrderWhereInput = {
      workspaceId,
      status: query.status,
      connectionId: query.connectionId,
      ...(query.search ? { name: { contains: query.search, mode: INSENSITIVE } } : {}),
    };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_SUMMARY_INCLUDE,
        orderBy: sortWithTiebreak('placedAt', query.direction ?? SortDirection.Desc),
        ...toPageWindow(query),
      }),
      this.prisma.order.count({ where }),
    ]);
    return { records, total };
  }

  findDetail(workspaceId: string, orderId: string): Promise<OrderDetailRecord | null> {
    return this.prisma.order.findFirst({
      where: { id: orderId, workspaceId },
      include: ORDER_DETAIL_INCLUDE,
    });
  }
}
