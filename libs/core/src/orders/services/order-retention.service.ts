import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus, PrismaService } from '@crossmart/database';
import { ORDER_PURGE_BATCH_SIZE, ORDER_RETENTION_MS } from '../orders.constants.js';

/** Statuses of orders that hold no stock, so they can be deleted once old. */
const FINISHED = [OrderStatus.FULFILLED, OrderStatus.CANCELLED];

/**
 * Keeps order data no longer than needed: finished orders placed before the retention period
 * are deleted with their lines, across workspaces, a batch at a time. Runs daily.
 */
@Injectable()
export class OrderRetentionService {
  private readonly logger = new Logger(OrderRetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** How many orders were deleted. */
  async purge(now: Date = new Date()): Promise<number> {
    const before = new Date(now.getTime() - ORDER_RETENTION_MS);
    let deleted = 0;
    for (;;) {
      const batch = await this.prisma.order.findMany({
        where: { placedAt: { lt: before }, status: { in: FINISHED } },
        select: { id: true },
        take: ORDER_PURGE_BATCH_SIZE,
      });
      if (batch.length === 0) break;
      const { count } = await this.prisma.order.deleteMany({
        where: { id: { in: batch.map(({ id }) => id) } },
      });
      deleted += count;
    }
    if (deleted > 0) this.logger.log(`Deleted ${deleted} orders past retention`);
    return deleted;
  }
}
