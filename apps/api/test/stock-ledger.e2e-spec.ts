import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ChannelType, type ExternalOrder } from '@crossmart/connectors';
import { Actor, StockAdjustmentMode, StockAdjustmentService, SyncJobQueue } from '@crossmart/core';
import { OrderIngestionService } from '@crossmart/core/orders/services/order-ingestion.service.js';
import { InventoryMovementReason, PrismaService } from '@crossmart/database';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

const OPENING_STOCK = 50;
const ROUNDS = 8;
const UNITS_RECEIVED = 5;
const UNITS_SHIPPED = 2;
const HOUR_MS = 60 * 60 * 1000;

interface Movement {
  delta: number;
  quantityAfter: number;
}

/** A shipped order of one line, as a channel would deliver it. */
function shippedOrder(sku: string): ExternalOrder {
  const now = new Date();
  return {
    externalId: randomUUID(),
    name: `#${randomUUID().slice(0, 6)}`,
    placedAt: now,
    updatedAt: now,
    cancelled: false,
    currencyCode: 'USD',
    total: '10.00',
    lines: [
      {
        externalId: randomUUID(),
        externalVariantId: null,
        sku,
        title: 'Ledger Mug',
        quantity: UNITS_SHIPPED,
        fulfilledQuantity: UNITS_SHIPPED,
        unitPrice: '5.00',
      },
    ],
  };
}

/** How many times each value occurs, to compare ledger quantities as multisets. */
function countOf(values: number[]): Map<number, number> {
  const counts = new Map<number, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

describe('Stock ledger (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder.overrideProvider(SyncJobQueue).useValue(new RecordingSyncJobQueue()),
    );
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createMug(user: SignedUpUser, sku: string): Promise<string> {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({ title: 'Ledger Mug', variants: [{ sku, price: '5', quantity: OPENING_STOCK }] });
    expect(created.status).toBe(HttpStatus.CREATED);
    const item = await prisma.inventoryItem.findFirstOrThrow({
      where: { workspaceId: user.workspaceId, variant: { sku } },
    });
    return item.id;
  }

  async function connectStore(workspaceId: string): Promise<string> {
    const { id } = await prisma.channelConnection.create({
      data: {
        workspaceId,
        channel: ChannelType.Shopify,
        externalAccountId: `${randomUUID()}.myshopify.com`,
        displayName: 'Ledger store',
      },
    });
    return id;
  }

  it('keeps the stock and its ledger consistent when adjustments and orders race', async () => {
    const seller = await signUp(app, 'Ledger Seller');
    const sku = `LEDGER-${randomUUID().slice(0, 6)}`;
    const inventoryItemId = await createMug(seller, sku);
    const connectionId = await connectStore(seller.workspaceId);
    const origin = {
      workspaceId: seller.workspaceId,
      connectionId,
      storeName: 'Ledger store',
      syncedFrom: new Date(Date.now() - HOUR_MS),
    };
    const adjustments = app.get(StockAdjustmentService);
    const orders = app.get(OrderIngestionService);

    await Promise.all(
      Array.from({ length: ROUNDS }, () => [
        adjustments.adjust(seller.workspaceId, inventoryItemId, {
          mode: StockAdjustmentMode.Delta,
          quantity: UNITS_RECEIVED,
          reason: InventoryMovementReason.RECEIVED,
          actor: Actor.system(),
        }),
        orders.ingest(origin, shippedOrder(sku)),
      ]).flat(),
    );

    const expected = OPENING_STOCK + ROUNDS * (UNITS_RECEIVED - UNITS_SHIPPED);
    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventoryItemId } });
    expect(item.available + item.reserved).toBe(expected);

    const movements: Movement[] = await prisma.inventoryMovement.findMany({
      where: { workspaceId: seller.workspaceId, inventoryItemId },
      select: { delta: true, quantityAfter: true },
    });
    expect(movements).toHaveLength(1 + 2 * ROUNDS);
    expect(movements.reduce((sum, movement) => sum + movement.delta, 0)).toBe(expected);
    // One unbroken chain: every entry starts where an earlier one (or zero) left the stock, so
    // no two writers moved the stock from the same starting point.
    const before = movements.map((movement) => movement.quantityAfter - movement.delta);
    const after = movements.map((movement) => movement.quantityAfter);
    expect(countOf([...before, expected])).toEqual(countOf([0, ...after]));
  });
});
