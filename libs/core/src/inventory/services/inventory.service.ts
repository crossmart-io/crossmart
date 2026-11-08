import { Injectable, NotFoundException } from '@nestjs/common';
import { toCountedPage } from '@crossmart/common';
import type {
  InventoryListQuery,
  InventoryMovementPage,
  InventoryPage,
  InventoryRow,
  MovementListQuery,
} from '../entities/inventory-views.js';
import { INVENTORY_ITEM_NOT_FOUND } from '../inventory.constants.js';
import { toInventoryRow, toMovementView } from '../mappers/inventory-view.mapper.js';
import { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import { InventoryMovementRepository } from '../repositories/inventory-movement.repository.js';

/** Stock of every variant, and the history of each one. */
@Injectable()
export class InventoryService {
  constructor(
    private readonly items: InventoryItemRepository,
    private readonly movements: InventoryMovementRepository,
  ) {}

  async list(workspaceId: string, query: InventoryListQuery): Promise<InventoryPage> {
    const { rows, nextCursor, total } = toCountedPage(
      await this.items.listPage(workspaceId, query),
      query.limit,
    );
    return { items: rows.map((record) => toInventoryRow(record)), nextCursor, total };
  }

  /** One variant's stock, with its product. */
  async get(workspaceId: string, inventoryItemId: string): Promise<InventoryRow> {
    const record = await this.items.findRow(workspaceId, inventoryItemId);
    if (!record) throw new NotFoundException(INVENTORY_ITEM_NOT_FOUND);
    return toInventoryRow(record);
  }

  async history(
    workspaceId: string,
    inventoryItemId: string,
    query: MovementListQuery,
  ): Promise<InventoryMovementPage> {
    if (!(await this.items.exists(workspaceId, inventoryItemId))) {
      throw new NotFoundException(INVENTORY_ITEM_NOT_FOUND);
    }
    const { rows, nextCursor, total } = toCountedPage(
      await this.movements.listPage(workspaceId, inventoryItemId, query),
      query.limit,
    );
    return { items: rows.map((record) => toMovementView(record)), nextCursor, total };
  }
}
