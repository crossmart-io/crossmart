import { Injectable } from '@nestjs/common';
import { OrderStatus, PrismaService, type Prisma } from '@crossmart/database';
import { SALES_INTERVAL_STEPS, TOP_PRODUCTS_LIMIT } from '../analytics.constants.js';
import type {
  BucketRow,
  PeriodBounds,
  SalesScope,
  StoreRow,
  TopProductRow,
} from '../entities/sales-scope.js';

/** The bucket unit and step, and how many buckets before now a period starts and ends. */
interface SalesWindow {
  unit: string;
  step: string;
  first: number;
  last: number;
}

/**
 * Sales aggregates over the workspace's orders. A period ends with the bucket holding now, in
 * the scope's time zone; `offset` moves it back by that many buckets (the previous period).
 */
@Injectable()
export class SalesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async workspaceCurrency(workspaceId: string): Promise<string> {
    const workspace = await this.prisma.workspace.findUniqueOrThrow({
      where: { id: workspaceId },
      select: { currency: true },
    });
    return workspace.currency;
  }

  async periodBounds(scope: SalesScope, offset: number): Promise<PeriodBounds> {
    const { unit, step, first, last } = this.window(scope, offset);
    const [bounds] = await this.prisma.$queryRaw<PeriodBounds[]>`
      SELECT ((p.first_start AT TIME ZONE ${scope.timeZone}) AT TIME ZONE 'UTC') AS "from",
             (((p.last_start + ${step}::interval) AT TIME ZONE ${scope.timeZone}) AT TIME ZONE 'UTC') AS "to"
      FROM (
        SELECT date_trunc(${unit}, now() AT TIME ZONE ${scope.timeZone}) - ${first} * ${step}::interval AS first_start,
               date_trunc(${unit}, now() AT TIME ZONE ${scope.timeZone}) - ${last} * ${step}::interval AS last_start
      ) p`;
    return bounds;
  }

  /** Sales and order counts per bucket and store; a bucket without orders has one empty row. */
  bucketRows(scope: SalesScope, offset: number): Promise<BucketRow[]> {
    const { unit, step, first, last } = this.window(scope, offset);
    return this.prisma.$queryRaw<BucketRow[]>`
      WITH buckets AS (
        SELECT series.local_start, (series.idx - 1)::int AS idx
        FROM generate_series(
          date_trunc(${unit}, now() AT TIME ZONE ${scope.timeZone}) - ${first} * ${step}::interval,
          date_trunc(${unit}, now() AT TIME ZONE ${scope.timeZone}) - ${last} * ${step}::interval,
          ${step}::interval
        ) WITH ORDINALITY AS series(local_start, idx)
      )
      SELECT b.idx, to_char(b.local_start, 'YYYY-MM-DD') AS "startsOn",
             o.connection_id AS "connectionId",
             COALESCE(SUM(o.total), 0) AS sales, COUNT(o.id)::int AS orders
      FROM buckets b
      LEFT JOIN orders o
        ON o.workspace_id = ${scope.workspaceId}::uuid
       AND o.currency_code = ${scope.currencyCode}
       AND o.status <> ${OrderStatus.CANCELLED}::order_status
       AND o.placed_at >= (b.local_start AT TIME ZONE ${scope.timeZone}) AT TIME ZONE 'UTC'
       AND o.placed_at < ((b.local_start + ${step}::interval) AT TIME ZONE ${scope.timeZone}) AT TIME ZONE 'UTC'
      GROUP BY b.idx, b.local_start, o.connection_id
      ORDER BY b.idx`;
  }

  async unitsSold(scope: SalesScope, bounds: PeriodBounds): Promise<number> {
    const result = await this.prisma.orderLine.aggregate({
      _sum: { quantity: true },
      where: { workspaceId: scope.workspaceId, order: this.countedOrders(scope, bounds) },
    });
    return result._sum.quantity ?? 0;
  }

  topProducts(scope: SalesScope, bounds: PeriodBounds): Promise<TopProductRow[]> {
    return this.prisma.$queryRaw<TopProductRow[]>`
      SELECT p.id AS "productId", p.title, SUM(l.quantity)::int AS units,
             SUM(l.quantity * l.unit_price) AS sales
      FROM order_lines l
      JOIN orders o ON o.id = l.order_id
      JOIN variants v ON v.id = l.variant_id
      JOIN products p ON p.id = v.product_id
      WHERE o.workspace_id = ${scope.workspaceId}::uuid
        AND o.currency_code = ${scope.currencyCode}
        AND o.status <> ${OrderStatus.CANCELLED}::order_status
        AND o.placed_at >= ${bounds.from} AND o.placed_at < ${bounds.to}
      GROUP BY p.id, p.title
      ORDER BY sales DESC, units DESC, p.id
      LIMIT ${TOP_PRODUCTS_LIMIT}`;
  }

  otherCurrencyOrders(scope: SalesScope, bounds: PeriodBounds): Promise<number> {
    return this.prisma.order.count({
      where: {
        ...this.countedOrders(scope, bounds),
        currencyCode: { not: scope.currencyCode },
      },
    });
  }

  stores(workspaceId: string): Promise<StoreRow[]> {
    return this.prisma.channelConnection.findMany({
      where: { workspaceId },
      select: { id: true, channel: true, displayName: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  private countedOrders(scope: SalesScope, bounds: PeriodBounds): Prisma.OrderWhereInput {
    return {
      workspaceId: scope.workspaceId,
      currencyCode: scope.currencyCode,
      status: { not: OrderStatus.CANCELLED },
      placedAt: { gte: bounds.from, lt: bounds.to },
    };
  }

  private window(scope: SalesScope, offset: number): SalesWindow {
    return {
      unit: scope.spec.interval,
      step: SALES_INTERVAL_STEPS[scope.spec.interval],
      first: scope.spec.buckets - 1 + offset,
      last: offset,
    };
  }
}
