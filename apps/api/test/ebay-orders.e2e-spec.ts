import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FakeHttpTransport, HttpMethod, HttpTransport, jsonResponse } from '@crossmart/connectors';
import {
  Actor,
  ListingSyncRunner,
  OrderJobQueue,
  OrderSyncService,
  StockAdjustmentMode,
  StockAdjustmentService,
  SyncJobKind,
  SyncJobQueue,
} from '@crossmart/core';
import {
  InventoryMovementReason,
  OrderStatus,
  PrismaService,
  ProductStatus,
} from '@crossmart/database';
import { connectEbayAccount, EBAY_API, EBAY_INVENTORY } from './support/ebay-account.js';
import { RecordingOrderJobQueue } from './support/recording-order-job.queue.js';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// The same fake app settings as `EBAY_TEST_ENV`, set before the app module reads them.
vi.hoisted(() => {
  Object.assign(process.env, {
    EBAY_CLIENT_ID: 'e2e-ebay-app-id',
    EBAY_CLIENT_SECRET: 'e2e-ebay-cert-id',
    EBAY_RU_NAME: 'E2E_Seller-E2EApp-SBX-abcdef',
    EBAY_ENVIRONMENT: 'sandbox',
    API_PUBLIC_URL: 'http://localhost:3009',
    WEB_APP_URL: 'http://localhost:5182',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const HOUR_MS = 60 * 60 * 1000;
const NO_CONTENT = { status: 204, headers: {}, body: '' };
const LISTING_ID = '110553007777';
const OFFER_ID = 'o-77';
const OPENING_STOCK = 10;
const ORDERS_URL = /\/sell\/fulfillment\/v1\/order\?filter=lastmodifieddate/;
const BULK_URL = `${EBAY_INVENTORY}/bulk_update_price_quantity`;

interface Seller {
  user: SignedUpUser;
  connectionId: string;
  productId: string;
  sku: string;
}

/** An eBay order of `quantity` units of `sku`, in the Fulfillment API's shape. */
function ebayOrder(orderId: string, sku: string, quantity: number, cancelState = 'NONE_REQUESTED') {
  const total = { value: `${12 * quantity}.00`, currency: 'USD' };
  return {
    orderId,
    creationDate: new Date().toISOString(),
    lastModifiedDate: new Date().toISOString(),
    orderFulfillmentStatus: 'NOT_STARTED',
    orderPaymentStatus: 'PAID',
    buyer: { username: 'e2e_buyer' },
    pricingSummary: { total },
    cancelStatus: { cancelState, cancelRequests: [] },
    paymentSummary: { refunds: [], payments: [] },
    lineItems: [
      {
        lineItemId: `${orderId}-1`,
        sku,
        title: 'Stoneware mug',
        quantity,
        lineItemCost: total,
        listingMarketplaceId: 'EBAY_US',
        lineItemFulfillmentStatus: 'NOT_STARTED',
        refunds: [],
      },
    ],
  };
}

/** eBay's offer for the SKU, live and showing `availableQuantity`. */
function liveOffer(sku: string, availableQuantity: number) {
  return jsonResponse({
    offers: [{ offerId: OFFER_ID, sku, status: 'PUBLISHED', availableQuantity }],
  });
}

describe('eBay orders and stock (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let orders: OrderSyncService;
  let runner: ListingSyncRunner;
  const http = new FakeHttpTransport();
  const syncJobs = new RecordingSyncJobQueue();
  let categoryTreeRead = false;

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(OrderJobQueue)
        .useValue(new RecordingOrderJobQueue())
        .overrideProvider(SyncJobQueue)
        .useValue(syncJobs),
    );
    prisma = app.get(PrismaService);
    orders = app.get(OrderSyncService);
    runner = app.get(ListingSyncRunner);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const base = (user: SignedUpUser) => `/api/v1/workspaces/${user.workspaceId}`;

  async function runQueued(): Promise<void> {
    for (const job of syncJobs.drain()) await runner.run(job);
  }

  async function saveListingDefaults(user: SignedUpUser, connectionId: string): Promise<void> {
    http.expect(HttpMethod.Post, `${EBAY_INVENTORY}/location/crossmart-default`, NO_CONTENT);
    const saved = await request(server())
      .put(`${base(user)}/channel-connections/${connectionId}/ebay/listing-defaults`)
      .set('Cookie', user.cookie)
      .send({
        fulfillmentPolicyId: null,
        paymentPolicyId: null,
        returnPolicyId: null,
        condition: 'NEW',
        location: { postalCode: '95125', country: 'US', city: null },
      });
    expect(saved.status).toBe(HttpStatus.OK);
  }

  async function createMug(user: SignedUpUser, sku: string): Promise<string> {
    const created = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: 'Stoneware mug',
        vendor: 'Acme',
        status: ProductStatus.ACTIVE,
        media: [{ url: 'https://cdn.example.com/mug.jpg' }],
        variants: [{ sku, price: '12.00', quantity: OPENING_STOCK }],
      });
    expect(created.status).toBe(HttpStatus.CREATED);
    return (created.body as { id: string }).id;
  }

  /** Publishes the product on eBay, answering the Inventory API with fakes. */
  async function publish(seller: Omit<Seller, 'productId'>, productId: string): Promise<void> {
    const { user, connectionId, sku } = seller;
    // The process reads the marketplace's category tree id once.
    if (!categoryTreeRead) {
      http.expect(
        HttpMethod.Get,
        /get_default_category_tree_id/,
        jsonResponse({ categoryTreeId: '0' }),
      );
      categoryTreeRead = true;
    }
    http
      .expect(
        HttpMethod.Get,
        /get_category_suggestions/,
        jsonResponse({
          categorySuggestions: [{ category: { categoryId: '20625', categoryName: 'Mugs' } }],
        }),
      )
      .expect(HttpMethod.Put, `${EBAY_INVENTORY}/inventory_item/${sku}`, NO_CONTENT)
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${sku}&`), jsonResponse({}, 404))
      .expect(HttpMethod.Post, `${EBAY_INVENTORY}/offer`, jsonResponse({ offerId: OFFER_ID }, 201))
      .expect(
        HttpMethod.Post,
        `${EBAY_INVENTORY}/offer/${OFFER_ID}/publish`,
        jsonResponse({ listingId: LISTING_ID }),
      )
      // Adding a product sends its stock too; the new listing shows it already.
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${sku}&`), liveOffer(sku, OPENING_STOCK));
    const added = await request(server())
      .post(`${base(user)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', user.cookie);
    expect(added.status).toBe(HttpStatus.CREATED);
    await runQueued();
    http.assertDone();
  }

  async function sellerWithListedMug(name: string): Promise<Seller> {
    const user = await signUp(app, name);
    const connectionId = await connectEbayAccount(app, http, user, {
      userId: `e2e${name.replace(/\W/g, '')}`,
      withPolicies: true,
    });
    await saveListingDefaults(user, connectionId);
    const sku = `MUG-${Date.now()}`;
    const productId = await createMug(user, sku);
    await publish({ user, connectionId, sku }, productId);
    // Order sync started an hour ago, so the orders the tests place are read.
    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: { ordersSyncedFrom: new Date(Date.now() - HOUR_MS) },
    });
    return { user, connectionId, productId, sku };
  }

  async function pollReturning(seller: Seller, ebayOrders: object[]): Promise<void> {
    http.expect(HttpMethod.Get, ORDERS_URL, jsonResponse({ offset: 0, orders: ebayOrders }));
    await orders.pollConnection(seller.user.workspaceId, seller.connectionId);
    http.assertDone();
  }

  async function stockOf(seller: Seller) {
    const variant = await prisma.variant.findFirstOrThrow({
      where: { workspaceId: seller.user.workspaceId, sku: seller.sku },
      select: { inventoryItem: { select: { id: true, available: true, reserved: true } } },
    });
    if (!variant.inventoryItem) throw new Error('The mug tracks no stock');
    return variant.inventoryItem;
  }

  it('lists variants under their SKU as the inventory id', async () => {
    const seller = await sellerWithListedMug('eBay Mapper');

    const variants = await prisma.listingVariant.findMany({
      where: { workspaceId: seller.user.workspaceId },
      select: { externalId: true, externalInventoryId: true },
    });
    expect(variants).toEqual([{ externalId: seller.sku, externalInventoryId: seller.sku }]);
  });

  it('reserves an eBay sale once, queues the stock push, and does not echo it back', async () => {
    const seller = await sellerWithListedMug('eBay Order Seller');
    const sale = ebayOrder('12-77777-00001', seller.sku, 2);

    await pollReturning(seller, [sale]);
    await pollReturning(seller, [sale]);

    expect(await stockOf(seller)).toMatchObject({ available: 8, reserved: 2 });
    const stored = await prisma.order.findFirstOrThrow({
      where: { connectionId: seller.connectionId },
      include: { lines: true },
    });
    expect(stored).toMatchObject({
      name: '12-77777-00001',
      status: OrderStatus.OPEN,
      total: expect.anything(),
    });
    expect(stored.lines).toMatchObject([{ quantity: 2, reservedQuantity: 2, sku: seller.sku }]);
    const queued = syncJobs.drain();
    expect(queued).toEqual([
      expect.objectContaining({
        kind: SyncJobKind.Inventory,
        connectionId: seller.connectionId,
        productId: seller.productId,
      }),
    ]);

    // eBay already shows the 8 units left after its own sale, so nothing is written.
    http.expect(
      HttpMethod.Get,
      new RegExp(`/offer\\?sku=${seller.sku}&`),
      liveOffer(seller.sku, 8),
    );
    for (const job of queued) await runner.run(job);
    http.assertDone();
    expect(http.requests.at(-1)?.url).not.toBe(BULK_URL);
  });

  it('sends a stock change made in Crossmart to the eBay listing', async () => {
    const seller = await sellerWithListedMug('eBay Stock Seller');
    const { id: inventoryItemId } = await stockOf(seller);

    await app.get(StockAdjustmentService).adjust(seller.user.workspaceId, inventoryItemId, {
      mode: StockAdjustmentMode.Delta,
      quantity: 3,
      reason: InventoryMovementReason.RECEIVED,
      actor: Actor.system(),
    });
    http
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${seller.sku}&`), liveOffer(seller.sku, 10))
      .expect(
        HttpMethod.Post,
        BULK_URL,
        jsonResponse({ responses: [{ statusCode: 200, sku: seller.sku, offerId: OFFER_ID }] }),
      );
    await runQueued();

    http.assertDone();
    expect(JSON.parse(http.requests.at(-1)?.body ?? '{}')).toEqual({
      requests: [
        {
          sku: seller.sku,
          shipToLocationAvailability: { quantity: 13 },
          offers: [{ offerId: OFFER_ID, availableQuantity: 13 }],
        },
      ],
    });
  });

  it('puts a cancelled eBay order’s units back on sale', async () => {
    const seller = await sellerWithListedMug('eBay Cancel Seller');

    await pollReturning(seller, [ebayOrder('12-77777-00002', seller.sku, 3)]);
    expect(await stockOf(seller)).toMatchObject({ available: 7, reserved: 3 });
    await pollReturning(seller, [ebayOrder('12-77777-00002', seller.sku, 3, 'CANCELED')]);

    expect(await stockOf(seller)).toMatchObject({ available: 10, reserved: 0 });
    const order = await prisma.order.findFirstOrThrow({
      where: { connectionId: seller.connectionId },
    });
    expect(order.status).toBe(OrderStatus.CANCELLED);
    syncJobs.drain();
  });

  it('reads the Fulfillment API with the account’s token', async () => {
    const seller = await sellerWithListedMug('eBay Token Seller');

    await pollReturning(seller, []);

    const call = http.requests.at(-1);
    expect(call?.url.startsWith(`${EBAY_API}/sell/fulfillment/v1/order?`)).toBe(true);
    expect(new URL(call?.url ?? EBAY_API).searchParams.get('limit')).toBe('200');
    expect(call?.headers?.authorization).toBe('Bearer v^1.1#e2e_access');
  });
});
