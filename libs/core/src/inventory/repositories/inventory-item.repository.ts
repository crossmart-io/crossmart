import { type CountedRecords, toPageWindow } from '@crossmart/common';
import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { InventoryListQuery } from '../entities/inventory-views.js';
import type { StockItemBySku } from '../entities/stock-levels.js';
import {
  INVENTORY_ROW_INCLUDE,
  inventoryRowOrder,
  type InventoryRowRecord,
} from './inventory.queries.js';
import { STOCK_LEVEL_FILTERS } from './stock-level.filters.js';

const INSENSITIVE = 'insensitive' as const;

@Injectable()
export class InventoryItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page of rows, plus one extra that tells the caller whether more exist. */
  async listPage(
    workspaceId: string,
    query: InventoryListQuery,
  ): Promise<CountedRecords<InventoryRowRecord>> {
    const where: Prisma.InventoryItemWhereInput = this.toListFilter(workspaceId, query);
    const [records, total] = await this.prisma.$transaction([
      this.prisma.inventoryItem.findMany({
        where,
        include: INVENTORY_ROW_INCLUDE,
        orderBy: inventoryRowOrder(query.sort, query.direction),
        ...toPageWindow(query),
      }),
      this.prisma.inventoryItem.count({ where }),
    ]);
    return { records, total };
  }

  findRow(workspaceId: string, inventoryItemId: string): Promise<InventoryRowRecord | null> {
    return this.prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, workspaceId },
      include: INVENTORY_ROW_INCLUDE,
    });
  }

  async exists(workspaceId: string, inventoryItemId: string): Promise<boolean> {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, workspaceId },
      select: { id: true },
    });
    return item !== null;
  }

  /** The stock items of the variants with these SKUs, in one query. */
  async findBySkus(workspaceId: string, skus: string[]): Promise<StockItemBySku[]> {
    const items = await this.prisma.inventoryItem.findMany({
      where: { workspaceId, variant: { sku: { in: skus } } },
      select: { id: true, tracked: true, variant: { select: { sku: true, productId: true } } },
    });
    return items.flatMap(({ id, tracked, variant }) =>
      variant.sku
        ? [{ inventoryItemId: id, productId: variant.productId, sku: variant.sku, tracked }]
        : [],
    );
  }

  private toListFilter(
    workspaceId: string,
    query: InventoryListQuery,
  ): Prisma.InventoryItemWhereInput {
    const search = query.search?.trim();
    return {
      workspaceId,
      ...(query.stockLevel ? STOCK_LEVEL_FILTERS[query.stockLevel] : {}),
      ...(search
        ? {
            variant: {
              OR: [
                { sku: { contains: search, mode: INSENSITIVE } },
                { product: { title: { contains: search, mode: INSENSITIVE } } },
              ],
            },
          }
        : {}),
    };
  }
}
