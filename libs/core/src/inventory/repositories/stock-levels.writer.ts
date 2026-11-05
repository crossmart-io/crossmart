import { Injectable } from '@nestjs/common';
import { PrismaService } from '@crossmart/database';
import type { LockedStock, StockMovement } from '../entities/inventory-ledger.js';
import type { StockLevelsChange, StockTarget } from '../entities/stock-levels.js';
import { InventoryLedger } from './inventory-ledger.js';

/**
 * Sets the available stock of many items in one transaction and a fixed number of statements,
 * whatever the batch size. Like a single adjustment, the rows are locked first and every change
 * is written to the ledger with the stock on hand after it, its reason and its author.
 */
@Injectable()
export class StockLevelsWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedger,
  ) {}

  /** Items outside the workspace, and items already at their target, are left alone. */
  async setAvailable(
    workspaceId: string,
    targets: StockTarget[],
    change: StockLevelsChange,
  ): Promise<void> {
    if (targets.length === 0) return;
    await this.prisma.$transaction(async (tx) => {
      const ids = targets.map((target) => target.inventoryItemId);
      const locked = await this.ledger.lockItems(tx, workspaceId, ids);
      await this.ledger.applyMovements(tx, workspaceId, this.toMovements(locked, targets, change));
    });
  }

  /** One movement per item; when an item appears twice, its last target wins. */
  private toMovements(
    locked: LockedStock[],
    targets: StockTarget[],
    change: StockLevelsChange,
  ): StockMovement[] {
    const availableById = new Map(
      targets.map((target) => [target.inventoryItemId, target.available]),
    );
    return locked.flatMap((stock) => {
      const available = availableById.get(stock.id);
      if (available === undefined) return [];
      return [
        { stock, availableDelta: available - stock.available, reservedDelta: 0, entry: change },
      ];
    });
  }
}
