import { Injectable } from '@nestjs/common';
import type { StockItemBySku, StockLevelsChange, StockTarget } from '../entities/stock-levels.js';
import { InventoryItemRepository } from '../repositories/inventory-item.repository.js';
import { StockLevelsWriter } from '../repositories/stock-levels.writer.js';

/**
 * Stock levels set in bulk, such as by an inventory file. Writes through the same ledger as
 * manual adjustments, so every change keeps its reason, author and resulting stock.
 */
@Injectable()
export class StockLevelsService {
  constructor(
    private readonly items: InventoryItemRepository,
    private readonly writer: StockLevelsWriter,
  ) {}

  findBySkus(workspaceId: string, skus: string[]): Promise<StockItemBySku[]> {
    return this.items.findBySkus(workspaceId, skus);
  }

  setAvailable(
    workspaceId: string,
    targets: StockTarget[],
    change: StockLevelsChange,
  ): Promise<void> {
    return this.writer.setAvailable(workspaceId, targets, change);
  }
}
