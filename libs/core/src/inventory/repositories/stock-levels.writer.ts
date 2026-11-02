import { Injectable } from '@nestjs/common';
import { type Prisma, PrismaService } from '@crossmart/database';
import type { StockLevelsChange, StockTarget } from '../entities/stock-levels.js';
import { toMovementActor } from '../mappers/movement-actor.mapper.js';

type Transaction = Prisma.TransactionClient;

interface LockedStock {
  id: string;
  available: number;
  reserved: number;
}

interface ResolvedTarget extends StockTarget {
  delta: number;
  quantityAfter: number;
}

/**
 * Sets the available stock of many items in one transaction and a fixed number of statements,
 * whatever the batch size. Like a single adjustment, the rows are locked first and every change
 * is written to the ledger with the stock on hand after it, its reason and its author.
 */
@Injectable()
export class StockLevelsWriter {
  constructor(private readonly prisma: PrismaService) {}

  /** Items outside the workspace, and items already at their target, are left alone. */
  async setAvailable(
    workspaceId: string,
    targets: StockTarget[],
    change: StockLevelsChange,
  ): Promise<void> {
    if (targets.length === 0) return;
    await this.prisma.$transaction(async (tx) => {
      const resolved = this.resolve(await this.lock(tx, workspaceId, targets), targets);
      if (resolved.length === 0) return;
      await this.writeAvailable(tx, workspaceId, resolved);
      await tx.inventoryMovement.createMany({
        data: resolved.map(({ inventoryItemId, delta, quantityAfter }) => ({
          workspaceId,
          inventoryItemId,
          delta,
          quantityAfter,
          reason: change.reason,
          ...toMovementActor(change.actor),
        })),
      });
    });
  }

  /** Locks the rows so a concurrent change cannot slip between the read and the write. */
  private lock(
    tx: Transaction,
    workspaceId: string,
    targets: StockTarget[],
  ): Promise<LockedStock[]> {
    const ids = targets.map((target) => target.inventoryItemId);
    return tx.$queryRaw<LockedStock[]>`
      SELECT id, available, reserved FROM inventory_items
      WHERE workspace_id = ${workspaceId}::uuid AND id = ANY (${ids}::uuid[])
      FOR UPDATE`;
  }

  private resolve(current: LockedStock[], targets: StockTarget[]): ResolvedTarget[] {
    const stockById = new Map(current.map((item) => [item.id, item]));
    return targets.flatMap((target) => {
      const stock = stockById.get(target.inventoryItemId);
      if (!stock || stock.available === target.available) return [];
      const delta = target.available - stock.available;
      return [{ ...target, delta, quantityAfter: target.available + stock.reserved }];
    });
  }

  private async writeAvailable(
    tx: Transaction,
    workspaceId: string,
    targets: ResolvedTarget[],
  ): Promise<void> {
    const ids = targets.map((target) => target.inventoryItemId);
    const quantities = targets.map((target) => target.available);
    await tx.$executeRaw`
      UPDATE inventory_items AS item
      SET available = target.available, updated_at = now()
      FROM unnest(${ids}::uuid[], ${quantities}::int[]) AS target(id, available)
      WHERE item.id = target.id AND item.workspace_id = ${workspaceId}::uuid`;
  }
}
