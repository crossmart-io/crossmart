import { createHmac, randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ChannelType, FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import {
  ActivityAction,
  ChannelWebhooksService,
  ORDER_RETENTION_MS,
  OrderJobQueue,
  OrderRetentionService,
  OrderSyncService,
  SyncJobQueue,
} from '@crossmart/core';
import { InventoryMovementReason, OrderStatus, PrismaService } from '@crossmart/database';
import { RecordingOrderJobQueue } from './support/recording-order-job.queue.js';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import {
  answerGraphql,
  connectShopifyStore,
  type GraphqlCall,
  newShop,
  ORDER_GRANTED_SCOPES,
  SHOPIFY_TEST_ENV,
} from './support/shopify-store.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// The same fake app settings as `SHOPIFY_TEST_ENV`, set before the app module reads them.
vi.hoisted(() => {
  Object.assign(process.env, {
    SHOPIFY_CLIENT_ID: 'e2e-client-id',
    SHOPIFY_CLIENT_SECRET: 'e2e-client-secret',
    API_PUBLIC_URL: 'http://localhost:3006',
    WEB_APP_URL: 'http://localhost:5179',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface LineInput {
  sku: string;
  quantity: number;
  fulfilled?: number;
}

function shopifyOrder(
  id: number,
  lines: LineInput[],
  options: { cancelled?: boolean; placedAt?: Date } = {},
) {
  const placedAt = options.placedAt ?? new Date();
  return {
    id: `gid://shopify/Order/${id}`,
    name: `#${id}`,
    createdAt: placedAt.toISOString(),
    updatedAt: new Date().toISOString(),
    cancelledAt: options.cancelled ? new Date().toISOString() : null,
    currencyCode: 'USD',
    currentTotalPriceSet: { shopMoney: { amount: '90.00' } },
    lineItems: {
      nodes: lines.map((line, index) => ({
        id: `gid://shopify/LineItem/${id}${index}`,
        sku: line.sku,
        name: `Line ${line.sku}`,
        currentQuantity: line.quantity,
        unfulfilledQuantity: line.quantity - (line.fulfilled ?? 0),
        variant: null,
        originalUnitPriceSet: { shopMoney: { amount: '45.00' } },
      })),
    },
  };
}

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let orders: OrderSyncService;
  const http = new FakeHttpTransport();
  const orderJobs = new RecordingOrderJobQueue();
  const syncJobs = new RecordingSyncJobQueue();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(OrderJobQueue)
        .useValue(orderJobs)
        .overrideProvider(SyncJobQueue)
        .useValue(syncJobs),
    );
    prisma = app.get(PrismaService);
    orders = app.get(OrderSyncService);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function sellerWithMug(): Promise<{
    user: SignedUpUser;
    shop: string;
    connectionId: string;
    sku: string;
  }> {
    const user = await signUp(app, 'Order Seller');
    const sku = `MUG-${randomUUID().slice(0, 6)}`;
    const created = await request(server())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({ title: 'Order Mug', variants: [{ sku, price: '45', quantity: 10 }] });
    expect(created.status).toBe(HttpStatus.CREATED);
    const shop = newShop();
    const connectionId = await connectShopifyStore(app, http, user, {
      shop,
      scope: ORDER_GRANTED_SCOPES,
    });
    // Order sync started an hour ago, so the orders the tests place are read.
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: { ordersSyncedFrom: new Date(Date.now() - HOUR_MS) },
    });
    return { user, shop, connectionId, sku };
  }

  function signedWebhook(topic: string, shop: string, body: object) {
    const rawBody = Buffer.from(JSON.stringify(body));
    return {
      rawBody,
      headers: {
        'x-shopify-topic': topic,
        'x-shopify-shop-domain': shop,
        'x-shopify-webhook-id': randomUUID(),
        'x-shopify-hmac-sha256': createHmac('sha256', SHOPIFY_TEST_ENV.SHOPIFY_CLIENT_SECRET)
          .update(rawBody)
          .digest('base64'),
      },
    };
  }

  async function stock(user: SignedUpUser, sku: string) {
    const response = await request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/inventory-items`)
      .query({ search: sku })
      .set('Cookie', user.cookie);
    const { onHand, reserved, available } = response.body.items[0];
    return { onHand, reserved, available };
  }

  /** Polls the seller's store, which answers with `nodes`. */
  async function pollReturning(
    { user, shop, connectionId }: { user: SignedUpUser; shop: string; connectionId: string },
    nodes: object[],
  ): Promise<void> {
    const calls: GraphqlCall[] = [];
    answerGraphql(http, shop, (call) => {
      calls.push(call);
      return { data: { orders: { nodes, pageInfo: { hasNextPage: false, endCursor: null } } } };
    });
    await orders.pollConnection(user.workspaceId, connectionId);
    expect(calls).toHaveLength(1);
  }

  it('reserves a new order’s stock once, ships it, and sends the new stock to the stores', async () => {
    const seller = await sellerWithMug();
    const { user, sku } = seller;

    await pollReturning(seller, [shopifyOrder(7001, [{ sku, quantity: 2 }])]);
    expect(await stock(user, sku)).toEqual({ onHand: 10, reserved: 2, available: 8 });
    await pollReturning(seller, [shopifyOrder(7001, [{ sku, quantity: 2 }])]);
    expect(await stock(user, sku)).toEqual({ onHand: 10, reserved: 2, available: 8 });

    await pollReturning(seller, [shopifyOrder(7001, [{ sku, quantity: 2, fulfilled: 2 }])]);
    expect(await stock(user, sku)).toEqual({ onHand: 8, reserved: 0, available: 8 });
    const shipped = await prisma.inventoryMovement.findFirst({
      where: { workspaceId: user.workspaceId, reason: InventoryMovementReason.ORDER_SHIPPED },
    });
    expect(shipped).toMatchObject({ delta: -2, quantityAfter: 8, note: '#7001' });

    const list = await request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/orders`)
      .set('Cookie', user.cookie);
    expect(list.body).toMatchObject({
      total: 1,
      items: [
        {
          name: '#7001',
          status: OrderStatus.FULFILLED,
          itemCount: 2,
          unmatchedLines: 0,
          storeName: 'E2E Store',
        },
      ],
    });
    const detail = await request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/orders/${list.body.items[0].id}`)
      .set('Cookie', user.cookie);
    expect(detail.body.lines).toMatchObject([
      { sku, quantity: 2, reservedQuantity: 0, fulfilledQuantity: 2 },
    ]);
    expect(JSON.stringify(detail.body)).not.toMatch(/email|address|phone/i);
  });

  it('reads an order a webhook names, releases a cancelled one, and flags units sold twice', async () => {
    const { user, shop, connectionId, sku } = await sellerWithMug();
    const raw = JSON.stringify({ id: 7101, admin_graphql_api_id: 'gid://shopify/Order/7101' });
    const delivered = await request(server())
      .post('/api/v1/webhooks/shopify')
      .set('Content-Type', 'application/json')
      .set('X-Shopify-Topic', 'orders/create')
      .set('X-Shopify-Shop-Domain', shop)
      .set('X-Shopify-Webhook-Id', randomUUID())
      .set(
        'X-Shopify-Hmac-Sha256',
        createHmac('sha256', SHOPIFY_TEST_ENV.SHOPIFY_CLIENT_SECRET).update(raw).digest('base64'),
      )
      .send(raw);
    expect(delivered.status).toBe(HttpStatus.OK);
    const [ref] = orderJobs.drain();
    expect(ref).toEqual({
      workspaceId: user.workspaceId,
      connectionId,
      externalOrderId: 'gid://shopify/Order/7101',
    });

    answerGraphql(http, shop, () => ({
      data: { order: shopifyOrder(7101, [{ sku, quantity: 12 }]) },
    }));
    await orders.fetchOne(ref!);
    expect(await stock(user, sku)).toEqual({ onHand: 10, reserved: 12, available: -2 });
    const activity = await request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/activity`)
      .query({ action: ActivityAction.StockOversold })
      .set('Cookie', user.cookie);
    expect(activity.body.items[0]).toMatchObject({ subject: { label: 'Order Mug' } });

    answerGraphql(http, shop, () => ({
      data: { order: shopifyOrder(7101, [{ sku, quantity: 12 }], { cancelled: true }) },
    }));
    await orders.fetchOne(ref!);
    expect(await stock(user, sku)).toEqual({ onHand: 10, reserved: 0, available: 10 });
    http.assertDone();
  });

  it('ignores orders placed before Crossmart started reading the store’s orders', async () => {
    const { user, shop, connectionId, sku } = await sellerWithMug();
    answerGraphql(http, shop, () => ({
      data: { order: shopifyOrder(7201, [{ sku, quantity: 1 }]) },
    }));
    await orders.fetchOne({
      workspaceId: user.workspaceId,
      connectionId,
      externalOrderId: 'gid://shopify/Order/7201',
    });
    const old = shopifyOrder(7202, [{ sku, quantity: 3 }], {
      placedAt: new Date(Date.now() - DAY_MS),
    });
    answerGraphql(http, shop, () => ({ data: { order: old } }));

    await orders.fetchOne({ workspaceId: user.workspaceId, connectionId, externalOrderId: old.id });

    expect(await stock(user, sku)).toEqual({ onHand: 10, reserved: 1, available: 9 });
    expect(await prisma.order.count({ where: { workspaceId: user.workspaceId } })).toBe(1);
  });

  it('deletes finished orders past retention, and a store’s orders when its data is erased', async () => {
    const seller = await sellerWithMug();
    const { user, sku } = seller;
    const old = new Date(Date.now() - ORDER_RETENTION_MS - DAY_MS);
    await pollReturning(seller, [
      shopifyOrder(7301, [{ sku, quantity: 1, fulfilled: 1 }]),
      shopifyOrder(7302, [{ sku, quantity: 2 }]),
    ]);
    await prisma.order.updateMany({
      where: { workspaceId: user.workspaceId },
      data: { placedAt: old },
    });

    await app.get(OrderRetentionService).purge();
    expect(
      (await prisma.order.findMany({ where: { workspaceId: user.workspaceId } })).map(
        (order) => order.name,
      ),
    ).toEqual(['#7302']);

    await app
      .get(ChannelWebhooksService)
      .handle(ChannelType.Shopify, signedWebhook('shop/redact', seller.shop, {}));
    expect(await prisma.order.count({ where: { workspaceId: user.workspaceId } })).toBe(0);
    expect(await stock(user, sku)).toEqual({ onHand: 9, reserved: 0, available: 9 });
  });
});
