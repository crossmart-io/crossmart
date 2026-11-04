import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import { SalesInterval, SalesRange } from '@crossmart/core';
import { OrderStatus, PrismaService } from '@crossmart/database';
import { connectShopifyStore, newShop } from './support/shopify-store.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

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

const DAY_MS = 24 * 60 * 60 * 1000;
const TOKYO = 'Asia/Tokyo';

interface PlacedOrder {
  daysAgo: number;
  total: string;
  quantity: number;
  status?: OrderStatus;
  currencyCode?: string;
  placedAt?: Date;
}

/** The calendar day an instant falls on in a time zone, as `YYYY-MM-DD`. */
function localDay(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(instant);
}

describe('Analytics (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = new FakeHttpTransport();

  beforeAll(async () => {
    app = await createTestApp((builder) => builder.overrideProvider(HttpTransport).useValue(http));
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function sellerWithStore(): Promise<{
    user: SignedUpUser;
    connectionId: string;
    variantId: string;
  }> {
    const user = await signUp(app, 'Report Seller');
    const created = await request(server())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({ title: 'Report Mug', variants: [{ sku: `RM-${randomUUID()}`, price: '20' }] });
    expect(created.status).toBe(HttpStatus.CREATED);
    const connectionId = await connectShopifyStore(app, http, user, { shop: newShop() });
    return { user, connectionId, variantId: created.body.variants[0].id };
  }

  async function place(
    seller: { user: SignedUpUser; connectionId: string; variantId: string },
    order: PlacedOrder,
  ): Promise<void> {
    const id = randomUUID();
    await prisma.order.create({
      data: {
        workspaceId: seller.user.workspaceId,
        connectionId: seller.connectionId,
        externalId: id,
        name: `#${id.slice(0, 4)}`,
        status: order.status ?? OrderStatus.OPEN,
        currencyCode: order.currencyCode ?? 'USD',
        total: order.total,
        placedAt: order.placedAt ?? new Date(Date.now() - order.daysAgo * DAY_MS),
        externalUpdatedAt: new Date(),
        lines: {
          create: {
            workspaceId: seller.user.workspaceId,
            externalId: id,
            variantId: seller.variantId,
            title: 'Report Mug',
            quantity: order.quantity,
            unitPrice: '20.00',
          },
        },
      },
    });
  }

  function report(user: SignedUpUser, query: Record<string, string>) {
    return request(server())
      .get(`/api/v1/workspaces/${user.workspaceId}/analytics/sales`)
      .query(query)
      .set('Cookie', user.cookie);
  }

  it('sums sales by day, against the week before, leaving out cancelled and foreign orders', async () => {
    const seller = await sellerWithStore();
    await place(seller, { daysAgo: 0, total: '60.00', quantity: 3 });
    await place(seller, { daysAgo: 2, total: '40.00', quantity: 2 });
    await place(seller, {
      daysAgo: 0,
      total: '500.00',
      quantity: 9,
      status: OrderStatus.CANCELLED,
    });
    await place(seller, { daysAgo: 0, total: '70.00', quantity: 1, currencyCode: 'EUR' });
    await place(seller, { daysAgo: 9, total: '25.00', quantity: 1 });

    const response = await report(seller.user, { range: SalesRange.Last7Days, timeZone: 'UTC' });

    expect(response.status).toBe(HttpStatus.OK);
    const body = response.body;
    expect(body.interval).toBe(SalesInterval.Day);
    expect(body.currencyCode).toBe('USD');
    expect(body.current).toEqual({
      sales: '100.00',
      orders: 2,
      units: 5,
      averageOrderValue: '50.00',
    });
    expect(body.previous).toMatchObject({ sales: '25.00', orders: 1, units: 1 });
    expect(body.otherCurrencyOrders).toBe(1);
    expect(body.buckets).toHaveLength(7);
    expect(body.buckets.at(-1)).toMatchObject({
      startsOn: localDay(new Date(), 'UTC'),
      sales: '60.00',
      orders: 1,
    });
    expect(body.stores).toEqual([
      expect.objectContaining({ connectionId: seller.connectionId, sales: '100.00', orders: 2 }),
    ]);
    expect(body.topProducts).toEqual([
      expect.objectContaining({ title: 'Report Mug', units: 5, sales: '100.00' }),
    ]);
  });

  it('buckets by the calendar day of the requested time zone', async () => {
    const seller = await sellerWithStore();
    const placedAt = new Date(Date.now() - DAY_MS / 2);
    await place(seller, { daysAgo: 0, total: '30.00', quantity: 1, placedAt });

    const response = await report(seller.user, { range: SalesRange.Last7Days, timeZone: TOKYO });

    const bucket = response.body.buckets.find(
      (candidate: { startsOn: string }) => candidate.startsOn === localDay(placedAt, TOKYO),
    );
    expect(bucket).toMatchObject({ sales: '30.00', orders: 1 });
  });

  it('groups a year by month and rejects unknown time zones', async () => {
    const seller = await sellerWithStore();
    const year = await report(seller.user, { range: SalesRange.Last12Months });
    expect(year.body.interval).toBe(SalesInterval.Month);
    expect(year.body.buckets).toHaveLength(12);
    expect(year.body.current.averageOrderValue).toBeNull();

    const invalid = await report(seller.user, { timeZone: 'Mars/Olympus_Mons' });
    expect(invalid.status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('keeps other workspaces out', async () => {
    const seller = await sellerWithStore();
    const stranger = await signUp(app, 'Report Stranger');
    const response = await request(server())
      .get(`/api/v1/workspaces/${seller.user.workspaceId}/analytics/sales`)
      .set('Cookie', stranger.cookie);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
