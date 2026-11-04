import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { InventoryListQuery } from '../entities/inventory-views.js';
import {
  INVENTORY_ROW_INCLUDE,
  INVENTORY_ROW_ORDER,
  type InventoryRowRecord,
} from './inventory.queries.js';
import { STOCK_LEVEL_FILTERS } from './stock-level.filters.js';

const INSENSITIVE = 'insensitive' as const;

@Injectable()
export class InventoryItemRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page of rows, plus one extra that tells the caller whether more exist. */
  listPage(workspaceId: string, query: InventoryListQuery): Promise<InventoryRowRecord[]> {
    return this.prisma.inventoryItem.findMany({
      where: this.toListFilter(workspaceId, query),
      include: INVENTORY_ROW_INCLUDE,
      orderBy: INVENTORY_ROW_ORDER,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
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
