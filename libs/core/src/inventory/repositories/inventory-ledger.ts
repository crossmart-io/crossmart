import { Injectable } from '@nestjs/common';
import { Prisma } from '@crossmart/database';
import type {
  LockedStock,
  StockAfterMovement,
  StockMovement,
} from '../entities/inventory-ledger.js';
import { toMovementActor } from '../mappers/movement-actor.mapper.js';

type Transaction = Prisma.TransactionClient;

/** A movement with the stock it leaves, ready to write. */
interface ResolvedMovement extends StockAfterMovement {
  movement: StockMovement;
  onHandDelta: number;
}

/**
 * The one way stock levels change. Callers lock the items inside their own transaction, decide
 * the change against the locked rows, then apply it: the item and its ledger entry are written
 * together, and `quantityAfter` always follows from the locked stock. Every statement is scoped
 * to the workspace, and rows are locked in id order so concurrent writers cannot deadlock.
 */
@Injectable()
export class InventoryLedger {
  /** Locks these stock items. Ids outside the workspace are left out of the result. */
  async lockItems(tx: Transaction, workspaceId: string, itemIds: string[]): Promise<LockedStock[]> {
    if (itemIds.length === 0) return [];
    return this.lock(tx, workspaceId, Prisma.sql`id = ANY(${sortedUnique(itemIds)}::uuid[])`);
  }

  /** Locks the stock items of these variants, keyed by variant id. */
  async lockVariants(
    tx: Transaction,
    workspaceId: string,
    variantIds: string[],
  ): Promise<Map<string, LockedStock>> {
    if (variantIds.length === 0) return new Map();
    const filter = Prisma.sql`variant_id = ANY(${sortedUnique(variantIds)}::uuid[])`;
    const rows = await this.lock(tx, workspaceId, filter);
    return new Map(rows.map((row) => [row.variantId, row]));
  }

  /** Applies one movement to an item locked in this transaction and returns its new stock. */
  async applyMovement(
    tx: Transaction,
    workspaceId: string,
    movement: StockMovement,
  ): Promise<StockAfterMovement> {
    const [after] = await this.applyMovements(tx, workspaceId, [movement]);
    return after ?? toAfter(resolve(movement));
  }

  /**
   * Applies many movements in a fixed number of statements, whatever their count. Each item
   * must be locked in this transaction and appear once. Movements that change nothing are skipped.
   */
  async applyMovements(
    tx: Transaction,
    workspaceId: string,
    movements: StockMovement[],
  ): Promise<StockAfterMovement[]> {
    const resolved = movements.map(resolve).filter(changesStock);
    if (resolved.length === 0) return [];
    await this.writeStock(tx, workspaceId, resolved);
    await this.writeEntries(tx, workspaceId, resolved);
    return resolved.map(toAfter);
  }

  private async lock(
    tx: Transaction,
    workspaceId: string,
    filter: Prisma.Sql,
  ): Promise<LockedStock[]> {
    return tx.$queryRaw<LockedStock[]>`
      SELECT id, variant_id AS "variantId", tracked, available, reserved
      FROM inventory_items
      WHERE workspace_id = ${workspaceId}::uuid AND ${filter}
      ORDER BY id
      FOR UPDATE`;
  }

  private async writeStock(
    tx: Transaction,
    workspaceId: string,
    resolved: ResolvedMovement[],
  ): Promise<void> {
    const ids = resolved.map((change) => change.inventoryItemId);
    const available = resolved.map((change) => change.available);
    const reserved = resolved.map((change) => change.reserved);
    await tx.$executeRaw`
      UPDATE inventory_items AS item
      SET available = target.available, reserved = target.reserved, updated_at = now()
      FROM unnest(${ids}::uuid[], ${available}::int[], ${reserved}::int[])
        AS target(id, available, reserved)
      WHERE item.id = target.id AND item.workspace_id = ${workspaceId}::uuid`;
  }

  /** Only changes to the stock on hand are ledger entries; reserving units moves none. */
  private async writeEntries(
    tx: Transaction,
    workspaceId: string,
    resolved: ResolvedMovement[],
  ): Promise<void> {
    const entries = resolved.filter((change) => change.onHandDelta !== 0);
    if (entries.length === 0) return;
    await tx.inventoryMovement.createMany({
      data: entries.map(({ inventoryItemId, onHandDelta, available, reserved, movement }) => ({
        workspaceId,
        inventoryItemId,
        delta: onHandDelta,
        quantityAfter: available + reserved,
        reason: movement.entry.reason,
        note: movement.entry.note ?? null,
        ...toMovementActor(movement.entry.actor),
      })),
    });
  }
}

function sortedUnique(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

function resolve(movement: StockMovement): ResolvedMovement {
  const { stock, availableDelta, reservedDelta } = movement;
  return {
    movement,
    inventoryItemId: stock.id,
    available: stock.available + availableDelta,
    reserved: stock.reserved + reservedDelta,
    onHandDelta: availableDelta + reservedDelta,
  };
}

function changesStock(change: ResolvedMovement): boolean {
  return change.movement.availableDelta !== 0 || change.movement.reservedDelta !== 0;
}

function toAfter({ inventoryItemId, available, reserved }: ResolvedMovement): StockAfterMovement {
  return { inventoryItemId, available, reserved };
}
