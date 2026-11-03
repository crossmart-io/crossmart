import { type CountedRecords, toPageWindow } from '@crossmart/common';
import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { MovementListQuery } from '../entities/inventory-views.js';
import {
  MOVEMENT_INCLUDE,
  MOVEMENT_ORDER,
  type InventoryMovementRecord,
} from './inventory.queries.js';

@Injectable()
export class InventoryMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** One page of an item's history, newest first, plus one extra row. */
  async listPage(
    workspaceId: string,
    inventoryItemId: string,
    query: MovementListQuery,
  ): Promise<CountedRecords<InventoryMovementRecord>> {
    const where: Prisma.InventoryMovementWhereInput = { workspaceId, inventoryItemId };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        include: MOVEMENT_INCLUDE,
        orderBy: MOVEMENT_ORDER,
        ...toPageWindow(query),
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { records, total };
  }
}
