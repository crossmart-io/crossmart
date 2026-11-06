import { Injectable } from '@nestjs/common';
import type { ExternalOrder, ExternalOrderLine } from '@crossmart/connectors';
import { InventoryMovementReason, type Prisma, PrismaService } from '@crossmart/database';
import { Actor } from '../../activity/entities/actor.js';
import type {
  LockedStock,
  StockAfterMovement,
  StockMovement,
} from '../../inventory/entities/inventory-ledger.js';
import { InventoryLedger } from '../../inventory/repositories/inventory-ledger.js';
import type { OrderToStore, OversoldItem, StoredOrder } from '../entities/order-ingestion.js';
import { ORDER_LOCK_PREFIX } from '../orders.constants.js';
import { type LineStock, lineStockChange, orderStatusOf } from '../rules/order-line-stock.js';
import { WebhookEventType } from '../../webhooks/enums/webhook-event-type.enum.js';
import { WebhookOutbox } from '../../webhooks/services/webhook-outbox.js';
import { addChange, findProductsOf, type ItemChange } from './order-stock.js';
import { readOrderEventData } from './order-webhook-event.js';

type Transaction = Prisma.TransactionClient;

/** A line as stored, with the stock it held before this copy of the order. */
interface HeldLine extends LineStock {
  variantId: string | null;
}

/** Where each line of the order now stands, to store with it. */
interface LinePlan {
  externalId: string;
  /** Null for a line that left the order. */
  line: ExternalOrderLine | null;
  variantId: string | null;
  stock: LineStock;
}

const NOT_APPLIED: StoredOrder = { applied: false, changedInventoryItemIds: [], oversold: [] };
const NOTHING_HELD: LineStock = { reserved: 0, fulfilled: 0 };
/** A line that left the order holds nothing any more. */
const REMOVED = { quantity: 0, fulfilledQuantity: 0 };

/** Every line the order has now, plus those it had before and no longer has. */
function linesOf(
  order: ExternalOrder,
  held: ReadonlyMap<string, HeldLine>,
): { externalId: string; line: ExternalOrderLine | null }[] {
  const current = new Set(order.lines.map((line) => line.externalId));
  const gone = [...held.keys()].filter((externalId) => !current.has(externalId));
  return [
    ...order.lines.map((line) => ({ externalId: line.externalId, line })),
    ...gone.map((externalId) => ({ externalId, line: null })),
  ];
}

/**
 * Stores a channel order and moves its stock in one transaction, under a lock on the order:
 * a webhook and a poll delivering the same order apply it once, and an older copy never
 * overwrites a newer one. Each line moves only the difference from what it held.
 */
@Injectable()
export class OrderWriter {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: InventoryLedger,
    private readonly outbox: WebhookOutbox,
  ) {}

  store(input: OrderToStore): Promise<StoredOrder> {
    return this.prisma.$transaction(async (tx) => {
      const { connectionId, order } = input;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ORDER_LOCK_PREFIX + connectionId + order.externalId}))`;
      const existing = await tx.order.findUnique({
        where: { connectionId_externalId: { connectionId, externalId: order.externalId } },
        include: { lines: true },
      });
      if (existing && existing.externalUpdatedAt > order.updatedAt) return NOT_APPLIED;
      const held = new Map<string, HeldLine>(
        (existing?.lines ?? []).map((line) => [
          line.externalId,
          {
            variantId: line.variantId,
            reserved: line.reservedQuantity,
            fulfilled: line.fulfilledQuantity,
          },
        ]),
      );
      const { plans, result } = await this.moveStock(tx, input, held);
      const orderId = await this.saveOrder(tx, input);
      for (const plan of plans)
        await this.saveLine(tx, { workspaceId: input.workspaceId, orderId }, plan);
      await this.publish(tx, input, orderId, existing?.externalUpdatedAt ?? null);
      return result;
    });
  }

  /**
   * `order.created` the first time an order is stored, `order.updated` when a newer copy
   * arrives. The same copy delivered twice (a webhook and a poll) is not an update.
   */
  private async publish(
    tx: Transaction,
    input: OrderToStore,
    orderId: string,
    storedUpdatedAt: Date | null,
  ): Promise<void> {
    if (storedUpdatedAt && storedUpdatedAt >= input.order.updatedAt) return;
    const type = storedUpdatedAt ? WebhookEventType.OrderUpdated : WebhookEventType.OrderCreated;
    await this.outbox.publish(tx, input.workspaceId, type, () =>
      readOrderEventData(tx, input.workspaceId, orderId),
    );
  }

  private async moveStock(
    tx: Transaction,
    input: OrderToStore,
    held: ReadonlyMap<string, HeldLine>,
  ): Promise<{ plans: LinePlan[]; result: StoredOrder }> {
    const lines = linesOf(input.order, held).map(({ externalId, line }) => ({
      externalId,
      line,
      variantId: held.get(externalId)?.variantId ?? input.variantIds.get(externalId) ?? null,
    }));
    const variantIds = [
      ...new Set(lines.flatMap(({ variantId }) => (variantId ? [variantId] : []))),
    ];
    const locked = await this.ledger.lockVariants(tx, input.workspaceId, variantIds);
    const changes = new Map<string, ItemChange>();
    const plans = lines.map((entry): LinePlan => {
      const before = held.get(entry.externalId) ?? NOTHING_HELD;
      const item = entry.variantId ? locked.get(entry.variantId) : undefined;
      if (!item?.tracked) return { ...entry, stock: before };
      const change = lineStockChange(before, entry.line ?? REMOVED, input.order.cancelled);
      addChange(changes, item.id, change);
      return { ...entry, stock: change.next };
    });
    const result = await this.applyChanges(tx, input, [...locked.values()], changes);
    return { plans, result };
  }

  /**
   * Moves the stock through the ledger: shipped units leave the stock on hand and are written
   * as an entry for the order; reserving or releasing units only moves them between columns.
   */
  private async applyChanges(
    tx: Transaction,
    input: OrderToStore,
    items: LockedStock[],
    changes: ReadonlyMap<string, ItemChange>,
  ): Promise<StoredOrder> {
    const entry = {
      reason: InventoryMovementReason.ORDER_SHIPPED,
      actor: Actor.system(),
      note: input.order.name,
    };
    const movements = items.flatMap((stock): StockMovement[] => {
      const change = changes.get(stock.id);
      return change ? [{ stock, ...change, entry }] : [];
    });
    const after = await this.ledger.applyMovements(tx, input.workspaceId, movements);
    const oversold = await this.findOversold(tx, input.workspaceId, movements, after);
    return {
      applied: true,
      changedInventoryItemIds: after.map((item) => item.inventoryItemId),
      oversold,
    };
  }

  /** Items this order took below zero: the units were sold twice. */
  private async findOversold(
    tx: Transaction,
    workspaceId: string,
    movements: StockMovement[],
    after: StockAfterMovement[],
  ): Promise<OversoldItem[]> {
    const availableById = new Map(after.map((item) => [item.inventoryItemId, item.available]));
    const oversold = movements.flatMap(({ stock, availableDelta }) => {
      const available = availableById.get(stock.id);
      return available !== undefined && available < 0 && availableDelta < 0
        ? [{ stock, available }]
        : [];
    });
    const products = await findProductsOf(
      tx,
      workspaceId,
      oversold.map(({ stock }) => stock.variantId),
    );
    return oversold.flatMap(({ stock, available }) => {
      const product = products.get(stock.variantId);
      return product ? [{ inventoryItemId: stock.id, available, ...product }] : [];
    });
  }

  private async saveOrder(tx: Transaction, input: OrderToStore): Promise<string> {
    const { workspaceId, connectionId, order } = input;
    const fields = {
      name: order.name,
      status: orderStatusOf(order.cancelled, order.lines),
      currencyCode: order.currencyCode,
      total: order.total,
      placedAt: order.placedAt,
      externalUpdatedAt: order.updatedAt,
    };
    const { id } = await tx.order.upsert({
      where: { connectionId_externalId: { connectionId, externalId: order.externalId } },
      create: { workspaceId, connectionId, externalId: order.externalId, ...fields },
      update: fields,
      select: { id: true },
    });
    return id;
  }

  /** A line that left the order keeps its title and price, with no units. */
  private async saveLine(
    tx: Transaction,
    target: { workspaceId: string; orderId: string },
    plan: LinePlan,
  ): Promise<void> {
    const { line } = plan;
    const values = {
      variantId: plan.variantId,
      quantity: line?.quantity ?? 0,
      reservedQuantity: plan.stock.reserved,
      fulfilledQuantity: plan.stock.fulfilled,
    };
    const content = line ? { sku: line.sku, title: line.title, unitPrice: line.unitPrice } : null;
    await tx.orderLine.upsert({
      where: { orderId_externalId: { orderId: target.orderId, externalId: plan.externalId } },
      create: {
        ...target,
        externalId: plan.externalId,
        title: '',
        unitPrice: '0',
        ...content,
        ...values,
      },
      update: { ...content, ...values },
    });
  }
}
