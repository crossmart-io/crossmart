import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import {
  ActivityAction,
  CatalogImportFormat,
  CatalogImportMode,
  type ChannelImportJobRef,
  ChannelImportQueue,
  ChannelImportRunner,
  ImportIssueCode,
} from '@crossmart/core';
import {
  ChannelConnectionStatus,
  ImportJobStatus,
  InventoryMovementReason,
  ListingStatus,
  PrismaService,
  WorkspaceRole,
} from '@crossmart/database';
import {
  connectShopifyStore,
  newShop,
  serveShopifyCatalog,
  SHOPIFY_ACCESS_TOKEN,
  SHOPIFY_REFRESH_TOKEN,
} from './support/shopify-store.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// Set before the app module loads its configuration. The values are fakes for this test only.
vi.hoisted(() => {
  Object.assign(process.env, {
    SHOPIFY_CLIENT_ID: 'e2e-client-id',
    SHOPIFY_CLIENT_SECRET: 'e2e-client-secret',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const CARD_HOLDER_SKU = 'NF-LCH-01';
const STORE_PRODUCTS = 4;

/** Runs imports in the request instead of the worker, so each test sees the finished import. */
class InlineImportQueue extends ChannelImportQueue {
  constructor(private readonly runner: ChannelImportRunner) {
    super();
  }

  enqueue(job: ChannelImportJobRef): Promise<void> {
    return this.runner.run(job, { finalAttempt: true });
  }
}

describe('Channel catalog imports (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = new FakeHttpTransport();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(ChannelImportQueue)
        .useFactory({
          factory: (runner: ChannelImportRunner) => new InlineImportQueue(runner),
          inject: [ChannelImportRunner],
        }),
    );
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    http.assertDone();
  });

  async function connectedStore(
    user: SignedUpUser,
  ): Promise<{ shop: string; connectionId: string }> {
    const shop = newShop();
    const connectionId = await connectShopifyStore(app, http, user, shop);
    return { shop, connectionId };
  }

  function startImport(user: SignedUpUser, connectionId: string, apiKey?: string) {
    const call = request(app.getHttpServer()).post(
      `/api/v1/workspaces/${user.workspaceId}/channel-connections/${connectionId}/imports`,
    );
    return apiKey ? call.set(API_KEY_HEADER, apiKey) : call.set('Cookie', user.cookie);
  }

  async function importStore(user: SignedUpUser, shop: string, connectionId: string) {
    serveShopifyCatalog(http, shop);
    const response = await startImport(user, connectionId);
    expect(response.status).toBe(HttpStatus.ACCEPTED);
    return request(app.getHttpServer())
      .get(`/api/v1/workspaces/${user.workspaceId}/import-jobs/${response.body.id}`)
      .set('Cookie', user.cookie);
  }

  it('imports the store’s products with listings, variant ids and stock', async () => {
    const owner = await signUp(app, 'Importer');
    const { shop, connectionId } = await connectedStore(owner);

    const job = await importStore(owner, shop, connectionId);

    expect(job.body).toMatchObject({
      mode: CatalogImportMode.CreateOrLink,
      format: CatalogImportFormat.ShopifyApi,
      fileName: 'E2E Store',
      connectionId,
      totalCount: STORE_PRODUCTS,
      status: ImportJobStatus.COMPLETED,
      counts: { created: STORE_PRODUCTS, linked: 0, updated: 0, skipped: 0, failed: 0 },
    });
    const listings = await prisma.listing.findMany({
      where: { connectionId },
      include: { variants: true, product: { select: { handle: true } } },
      orderBy: { externalId: 'asc' },
    });
    expect(listings.map((listing) => [listing.product.handle, listing.status])).toEqual([
      ['leather-card-holder', ListingStatus.ACTIVE],
      ['canvas-tote', ListingStatus.ACTIVE],
      ['gift-card-sleeve', ListingStatus.INACTIVE],
      ['wool-scarf', ListingStatus.INACTIVE],
    ]);
    expect(listings[1]?.variants).toHaveLength(12);
    expect(listings[0]?.variants[0]).toMatchObject({
      externalId: 'gid://shopify/ProductVariant/8001',
      externalInventoryId: 'gid://shopify/InventoryItem/8501',
    });

    const movements = await prisma.inventoryMovement.findMany({
      where: {
        inventoryItem: { variant: { workspaceId: owner.workspaceId, sku: CARD_HOLDER_SKU } },
      },
    });
    expect(movements).toMatchObject([
      { delta: 14, quantityAfter: 14, reason: InventoryMovementReason.IMPORTED },
    ]);
    expect(movements[0]?.actorUserId).not.toBeNull();

    const connection = await prisma.channelConnection.findUniqueOrThrow({
      where: { id: connectionId },
    });
    expect(connection.lastSyncedAt).not.toBeNull();
    const activity = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/activity`)
      .set('Cookie', owner.cookie);
    expect(activity.body.items[0]).toMatchObject({
      action: ActivityAction.ChannelCatalogImported,
      summary: 'Imported 4 products from “E2E Store”',
    });
  });

  it('re-runs safely: linked products are refreshed, never duplicated', async () => {
    const owner = await signUp(app, 'Repeat Importer');
    const { shop, connectionId } = await connectedStore(owner);
    await importStore(owner, shop, connectionId);

    const again = await importStore(owner, shop, connectionId);

    expect(again.body.counts).toEqual({ created: 0, linked: 0, updated: 4, skipped: 0, failed: 0 });
    expect(await prisma.product.count({ where: { workspaceId: owner.workspaceId } })).toBe(
      STORE_PRODUCTS,
    );
    expect(await prisma.listing.count({ where: { connectionId } })).toBe(STORE_PRODUCTS);
    const movements = await prisma.inventoryMovement.count({
      where: { workspaceId: owner.workspaceId },
    });
    expect(movements).toBe(13);
  });

  it('links catalog products that match by handle or SKU instead of duplicating them', async () => {
    const owner = await signUp(app, 'Linker');
    const productsUrl = `/api/v1/workspaces/${owner.workspaceId}/products`;
    for (const product of [
      {
        title: 'Card holder',
        handle: 'leather-card-holder',
        variants: [{ sku: 'CH-OWN', price: '30', quantity: 2 }],
      },
      {
        title: 'Our tote',
        handle: 'our-tote',
        variants: [{ sku: 'NF-TOTE-BLA-S', price: '60', quantity: 1 }],
      },
    ]) {
      const created = await request(app.getHttpServer())
        .post(productsUrl)
        .set('Cookie', owner.cookie)
        .send(product);
      expect(created.status).toBe(HttpStatus.CREATED);
    }
    const { shop, connectionId } = await connectedStore(owner);

    const job = await importStore(owner, shop, connectionId);

    expect(job.body.counts).toEqual({ created: 2, linked: 2, updated: 0, skipped: 0, failed: 0 });
    expect(job.body.issues).toHaveLength(11);
    expect(job.body.issues[0]).toMatchObject({
      code: ImportIssueCode.UnmatchedVariant,
      handle: 'canvas-tote',
    });
    expect(await prisma.product.count({ where: { workspaceId: owner.workspaceId } })).toBe(4);
    const cardHolder = await prisma.listing.findFirstOrThrow({
      where: { connectionId, externalId: 'gid://shopify/Product/9001' },
      include: { product: { include: { variants: { include: { inventoryItem: true } } } } },
    });
    expect(cardHolder.product.handle).toBe('leather-card-holder');
    expect(cardHolder.product.variants[0]?.inventoryItem?.available).toBe(2);
    const tote = await prisma.listing.findFirstOrThrow({
      where: { connectionId, externalId: 'gid://shopify/Product/9002' },
      include: { product: true, variants: true },
    });
    expect(tote.product.handle).toBe('our-tote');
    expect(tote.variants).toHaveLength(1);
  });

  it('keeps imports inside their workspace and checks the caller may edit the catalog', async () => {
    const owner = await signUp(app, 'Store Owner');
    const outsider = await signUp(app, 'Outsider');
    const { connectionId } = await connectedStore(owner);

    expect((await startImport(outsider, connectionId)).status).toBe(HttpStatus.NOT_FOUND);
    const foreign = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/channel-connections/${connectionId}/imports`)
      .set('Cookie', outsider.cookie);
    expect(foreign.status).toBe(HttpStatus.NOT_FOUND);

    const viewerKey = await request(app.getHttpServer())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Read only', role: WorkspaceRole.VIEWER });
    const asViewer = await startImport(owner, connectionId, viewerKey.body.secret);
    expect(asViewer.status).toBe(HttpStatus.FORBIDDEN);
    expect(await prisma.importJob.count({ where: { connectionId } })).toBe(0);
  });

  it('refuses disconnected stores and never returns credentials', async () => {
    const owner = await signUp(app, 'Careful Importer');
    const { shop, connectionId } = await connectedStore(owner);
    const job = await importStore(owner, shop, connectionId);
    const history = await request(app.getHttpServer())
      .get(`/api/v1/workspaces/${owner.workspaceId}/import-jobs`)
      .set('Cookie', owner.cookie);
    for (const body of [job.text, history.text]) {
      expect(body).not.toContain(SHOPIFY_ACCESS_TOKEN);
      expect(body).not.toContain(SHOPIFY_REFRESH_TOKEN);
    }

    await prisma.channelConnection.update({
      where: { id: connectionId },
      data: { status: ChannelConnectionStatus.DISCONNECTED, credentials: null },
    });
    const refused = await startImport(owner, connectionId);
    expect(refused.status).toBe(HttpStatus.CONFLICT);
    expect(refused.text).not.toContain(SHOPIFY_ACCESS_TOKEN);
  });
});
