import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
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
  listPage(
    workspaceId: string,
    inventoryItemId: string,
    query: MovementListQuery,
  ): Promise<InventoryMovementRecord[]> {
    return this.prisma.inventoryMovement.findMany({
      where: { workspaceId, inventoryItemId },
      include: MOVEMENT_INCLUDE,
      orderBy: MOVEMENT_ORDER,
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
  }
}
