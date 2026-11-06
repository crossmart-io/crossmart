import { Injectable } from '@nestjs/common';
import {
  type ChannelConnectionStatus,
  type ListingStatus,
  PrismaService,
  type Prisma,
} from '@crossmart/database';
import { StockLevel } from '../../inventory/enums/stock-level.enum.js';
import {
  INVENTORY_ROW_INCLUDE,
  type InventoryRowRecord,
} from '../../inventory/repositories/inventory.queries.js';
import { STOCK_LEVEL_FILTERS } from '../../inventory/repositories/stock-level.filters.js';

export interface InventoryValueRow {
  atCost: Prisma.Decimal;
  atPrice: Prisma.Decimal;
  unitsOnHand: number;
  variantsWithoutCost: number;
}

export interface StoreRecord {
  id: string;
  channel: string;
  displayName: string;
  status: ChannelConnectionStatus;
  lastSyncedAt: Date | null;
}

export interface ListingCountRow {
  connectionId: string;
  status: ListingStatus;
  count: number;
}

/** What the workspace holds in stock and how its listings stand on each store. */
@Injectable()
export class InventoryReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async value(workspaceId: string): Promise<InventoryValueRow> {
    const [row] = await this.prisma.$queryRaw<InventoryValueRow[]>`
      WITH stock AS (
        SELECT GREATEST(i.available, 0) + i.reserved AS on_hand, v.cost, v.price
        FROM inventory_items i
        JOIN variants v ON v.id = i.variant_id
        WHERE i.workspace_id = ${workspaceId}::uuid AND i.tracked
      )
      SELECT COALESCE(SUM(on_hand * cost), 0) AS "atCost",
             COALESCE(SUM(on_hand * price), 0) AS "atPrice",
             COALESCE(SUM(on_hand), 0)::int AS "unitsOnHand",
             (COUNT(*) FILTER (WHERE cost IS NULL AND on_hand > 0))::int AS "variantsWithoutCost"
      FROM stock`;
    return row;
  }

  stockLevelCount(workspaceId: string, level: StockLevel): Promise<number> {
    return this.prisma.inventoryItem.count({
      where: { workspaceId, ...STOCK_LEVEL_FILTERS[level] },
    });
  }

  /**
   * Tracked variants out of stock or low, fewest available first (oversold before sold out),
   * then by id so the order is stable. Served by the `(workspace_id, tracked, available)` index.
   */
  lowestStock(workspaceId: string, limit: number): Promise<InventoryRowRecord[]> {
    return this.prisma.inventoryItem.findMany({
      where: {
        workspaceId,
        OR: [STOCK_LEVEL_FILTERS[StockLevel.OutOfStock], STOCK_LEVEL_FILTERS[StockLevel.LowStock]],
      },
      include: INVENTORY_ROW_INCLUDE,
      orderBy: [{ available: 'asc' }, { id: 'asc' }],
      take: limit,
    });
  }

  stores(workspaceId: string): Promise<StoreRecord[]> {
    return this.prisma.channelConnection.findMany({
      where: { workspaceId },
      select: { id: true, channel: true, displayName: true, status: true, lastSyncedAt: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  async listingCounts(workspaceId: string): Promise<ListingCountRow[]> {
    const groups = await this.prisma.listing.groupBy({
      by: ['connectionId', 'status'],
      where: { workspaceId },
      _count: { _all: true },
    });
    return groups.map((group) => ({
      connectionId: group.connectionId,
      status: group.status,
      count: group._count._all,
    }));
  }
}
