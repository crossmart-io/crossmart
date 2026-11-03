import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import {
  ActivityAction,
  CompareAtMode,
  ListingSyncRunner,
  PriceRounding,
  PriceSource,
  StockAdjustmentMode,
  SyncJobKind,
  SyncJobQueue,
} from '@crossmart/core';
import { InventoryMovementReason, ListingStatus, ProductStatus } from '@crossmart/database';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import {
  answerGraphql,
  connectShopifyStore,
  type GraphqlCall,
  newShop,
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

interface CreatedProduct {
  id: string;
  title: string;
  variants: { id: string; sku: string; price: string }[];
  media: { url: string }[];
}

interface ProductInput {
  title: string;
  tags?: string[];
  vendor?: string;
  status?: ProductStatus;
  price?: string;
  cost?: string;
  quantity?: number;
}

const RULE = {
  adjustmentPercent: '15',
  fixedAmount: '0',
  rounding: PriceRounding.Ending99,
  floor: { minMarginPercent: '30' },
  compareAt: CompareAtMode.Adjust,
};

function productSetReply(call: GraphqlCall, productId: string) {
  const input = call.variables.input as { variants: { position: number }[] };
  return {
    data: {
      productSet: {
        product: {
          id: productId,
          status: 'ACTIVE',
          onlineStoreUrl: null,
          variants: {
            nodes: input.variants.map((variant) => ({
              id: `gid://shopify/ProductVariant/${productId.slice(-4)}${variant.position}`,
              position: variant.position,
              inventoryItem: {
                id: `gid://shopify/InventoryItem/${productId.slice(-4)}${variant.position}`,
              },
            })),
          },
        },
        userErrors: [],
      },
    },
  };
}

/** Answers each Admin API call the way Shopify would, by the operation it is. */
function shopifyReply(call: GraphqlCall, productId: string): unknown {
  if (call.query.includes('productSet')) return productSetReply(call, productId);
  if (call.query.includes('inventorySetQuantities')) {
    return { data: { inventorySetQuantities: { userErrors: [] } } };
  }
  if (call.query.includes('productUpdate')) return { data: { productUpdate: { userErrors: [] } } };
  return { data: { location: { id: 'gid://shopify/Location/1' } } };
}

describe('Listings (e2e)', () => {
  let app: INestApplication<App>;
  const http = new FakeHttpTransport();
  const queue = new RecordingSyncJobQueue();
  let runner: ListingSyncRunner;

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(SyncJobQueue)
        .useValue(queue),
    );
    runner = app.get(ListingSyncRunner);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const base = (user: SignedUpUser) => `/api/v1/workspaces/${user.workspaceId}`;

  async function createProduct(user: SignedUpUser, input: ProductInput): Promise<CreatedProduct> {
    const response = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: input.title,
        tags: input.tags ?? [],
        vendor: input.vendor,
        status: input.status ?? ProductStatus.ACTIVE,
        media: [{ url: 'https://cdn.example.com/a.jpg' }, { url: 'https://cdn.example.com/b.jpg' }],
        variants: [
          {
            sku: `${input.title.toUpperCase().replace(/\W/g, '-')}-${Date.now()}`,
            price: input.price ?? '89.00',
            cost: input.cost,
            quantity: input.quantity ?? 10,
          },
        ],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body as CreatedProduct;
  }

  function connectionPath(user: SignedUpUser, connectionId: string, path: string): string {
    return `${base(user)}/channel-connections/${connectionId}/${path}`;
  }

  async function runQueued(): Promise<SyncJobKind[]> {
    const jobs = queue.drain();
    for (const job of jobs) {
      await runner.run(job);
    }
    return jobs.map((job) => job.kind);
  }

  describe('pricing rule', () => {
    it('validates the rule, saves it, previews it on a real product and logs the change', async () => {
      const owner = await signUp(app, 'Pricing Owner');
      const connectionId = await connectShopifyStore(app, http, owner);
      const product = await createProduct(owner, {
        title: 'Stoneware Mug',
        price: '89.00',
        cost: '40.00',
      });
      const pricingPath = connectionPath(owner, connectionId, 'pricing');

      const invalid = await Promise.all(
        [
          { ...RULE, adjustmentPercent: '-95' },
          { ...RULE, adjustmentPercent: '1.005' },
          { ...RULE, rounding: 'ending_49' },
          { ...RULE, floor: { minMarginPercent: 'lots' } },
        ].map((rule) =>
          request(server()).put(pricingPath).set('Cookie', owner.cookie).send({ rule }),
        ),
      );
      const saved = await request(server())
        .put(pricingPath)
        .set('Cookie', owner.cookie)
        .send({ rule: RULE });
      const preview = await request(server())
        .post(connectionPath(owner, connectionId, 'pricing/preview'))
        .set('Cookie', owner.cookie)
        .send({ rule: RULE, productId: product.id });

      expect(invalid.map((response) => response.status)).toEqual(
        Array(4).fill(HttpStatus.BAD_REQUEST),
      );
      expect(invalid[0].body.detail ?? invalid[0].body.message).toContain('between -90 and 500');
      expect(saved.status).toBe(HttpStatus.OK);
      expect(saved.body.pricing).toEqual(RULE);
      expect(preview.body).toMatchObject({
        currencyCode: 'USD',
        product: { id: product.id, title: 'Stoneware Mug' },
        variants: [
          {
            basePrice: '89.00',
            cost: '40.00',
            resolved: { price: '102.99', explanation: '$89.00 → +15% → .99 = $102.99' },
          },
        ],
      });
      const activity = await request(server())
        .get(`${base(owner)}/activity`)
        .set('Cookie', owner.cookie);
      expect(activity.body.items[0]).toMatchObject({
        action: ActivityAction.ChannelPricingUpdated,
        summary: 'Changed the pricing rule of “E2E Store”: +15%, .99, floor cost +30%',
      });
    });
  });

  describe('product selection', () => {
    it('previews filters with tags and vendor plus manual picks, with counts', async () => {
      const owner = await signUp(app, 'Selector');
      const connectionId = await connectShopifyStore(app, http, owner);
      const summer = await createProduct(owner, {
        title: 'Summer Hat',
        tags: ['summer'],
        vendor: 'Acme',
      });
      const beach = await createProduct(owner, {
        title: 'Beach Towel',
        tags: ['summer'],
        vendor: 'Other',
      });
      const winter = await createProduct(owner, {
        title: 'Winter Scarf',
        tags: ['winter'],
        vendor: 'Acme',
      });
      const preview = (rule: object | null) =>
        request(server())
          .post(connectionPath(owner, connectionId, 'product-selection/preview'))
          .set('Cookie', owner.cookie)
          .send({ rule });

      const byTag = await preview({
        filter: { tags: ['summer'] },
        includeProductIds: [],
        excludeProductIds: [],
      });
      const mixed = await preview({
        filter: { vendor: 'acme' },
        includeProductIds: [beach.id],
        excludeProductIds: [winter.id],
      });
      const manualOnly = await preview({
        filter: null,
        includeProductIds: [winter.id],
        excludeProductIds: [],
      });
      const everything = await preview(null);

      expect(byTag.body.items.map((item: { title: string }) => item.title)).toEqual([
        'Beach Towel',
        'Summer Hat',
      ]);
      expect(mixed.body).toMatchObject({
        total: 2,
        matchingFilter: 2,
        addedManually: 1,
        removedManually: 1,
      });
      expect(mixed.body.items.map((item: { id: string }) => item.id)).toEqual([
        beach.id,
        summer.id,
      ]);
      expect(manualOnly.body).toMatchObject({ total: 1, matchingFilter: 0, addedManually: 1 });
      expect(everything.body.total).toBe(3);
    });

    it('saves the selection and rejects bad ids', async () => {
      const owner = await signUp(app, 'Selection Saver');
      const connectionId = await connectShopifyStore(app, http, owner);
      const path = connectionPath(owner, connectionId, 'product-selection');

      const bad = await request(server())
        .put(path)
        .set('Cookie', owner.cookie)
        .send({ rule: { filter: {}, includeProductIds: ['nope'], excludeProductIds: [] } });
      const saved = await request(server())
        .put(path)
        .set('Cookie', owner.cookie)
        .send({
          rule: { filter: { status: 'ACTIVE' }, includeProductIds: [], excludeProductIds: [] },
        });

      expect(bad.status).toBe(HttpStatus.BAD_REQUEST);
      expect(saved.body.productSelection).toEqual({
        filter: { status: 'ACTIVE' },
        includeProductIds: [],
        excludeProductIds: [],
      });
    });
  });

  describe('overrides', () => {
    it('creates, reads and clears a product’s overrides on one channel', async () => {
      const owner = await signUp(app, 'Overrider');
      const connectionId = await connectShopifyStore(app, http, owner);
      const product = await createProduct(owner, { title: 'Linen Shirt', quantity: 10 });
      const channelsPath = `${base(owner)}/products/${product.id}/channels`;
      const overridePath = `${channelsPath}/${connectionId}/override`;
      const [variant] = product.variants;

      const saved = await request(server())
        .put(overridePath)
        .set('Cookie', owner.cookie)
        .send({
          title: 'Linen Shirt – Shopify edition',
          tags: ['shopify-only'],
          mediaUrls: ['https://cdn.example.com/b.jpg'],
          visibility: 'HIDDEN',
          inventoryBuffer: 3,
          maxQuantity: 5,
          variantPrices: [{ variantId: variant.id, price: '79.00', compareAtPrice: null }],
        });
      const foreignImage = await request(server())
        .put(overridePath)
        .set('Cookie', owner.cookie)
        .send({ mediaUrls: ['https://elsewhere.example.com/x.jpg'] });
      const listed = await request(server()).get(channelsPath).set('Cookie', owner.cookie);
      const cleared = await request(server()).delete(overridePath).set('Cookie', owner.cookie);

      expect(saved.status).toBe(HttpStatus.OK);
      expect(saved.body).toMatchObject({
        listing: { status: ListingStatus.PENDING },
        override: {
          title: 'Linen Shirt – Shopify edition',
          visibility: 'HIDDEN',
          inventoryBuffer: 3,
        },
        variants: [
          {
            variantId: variant.id,
            quantity: 5,
            price: {
              price: '79.00',
              source: PriceSource.Override,
              explanation: 'manual price = $79.00',
            },
          },
        ],
      });
      expect(foreignImage.status).toBe(HttpStatus.BAD_REQUEST);
      expect(listed.body).toHaveLength(1);
      expect(listed.body[0].override.mediaUrls).toEqual(['https://cdn.example.com/b.jpg']);
      expect(cleared.body.override).toBeNull();
      expect(cleared.body.variants[0].price.source).toBe(PriceSource.Base);
    });
  });

  describe('publishing to Shopify', () => {
    it('publishes selected products, updates them in place, syncs stock and delists', async () => {
      const owner = await signUp(app, 'Publisher');
      const shop = newShop();
      const connectionId = await connectShopifyStore(app, http, owner, shop);
      const mug = await createProduct(owner, {
        title: 'Publish Mug',
        tags: ['live'],
        quantity: 12,
      });
      await createProduct(owner, { title: 'Hidden Bowl', tags: ['draft-only'] });
      await request(server())
        .put(connectionPath(owner, connectionId, 'product-selection'))
        .set('Cookie', owner.cookie)
        .send({
          rule: { filter: { tags: ['live'] }, includeProductIds: [], excludeProductIds: [] },
        });
      await request(server())
        .put(connectionPath(owner, connectionId, 'pricing'))
        .set('Cookie', owner.cookie)
        .send({ rule: RULE });
      await request(server())
        .put(`${base(owner)}/products/${mug.id}/channels/${connectionId}/override`)
        .set('Cookie', owner.cookie)
        .send({ inventoryBuffer: 2 });
      const PRODUCT_GID = 'gid://shopify/Product/990001';
      const calls: GraphqlCall[] = [];
      const expectCalls = (count: number) =>
        answerGraphql(
          http,
          shop,
          (call) => {
            calls.push(call);
            return shopifyReply(call, PRODUCT_GID);
          },
          count,
        );
      const lastCall = (operation: string) =>
        calls.filter((call) => call.query.includes(operation)).at(-1);

      // 1. "Publish": the selected product is queued and created with productSet.
      const sync = await request(server())
        .post(connectionPath(owner, connectionId, 'sync'))
        .set('Cookie', owner.cookie);
      const pending = await request(server())
        .get(connectionPath(owner, connectionId, 'listings'))
        .set('Cookie', owner.cookie);
      expectCalls(2);
      expect(await runQueued()).toEqual([SyncJobKind.Content]);

      expect(sync.status).toBe(HttpStatus.ACCEPTED);
      expect(sync.body).toEqual({ queued: 1, delisting: 0 });
      expect(pending.body.items).toMatchObject([
        { productId: mug.id, status: ListingStatus.PENDING },
      ]);
      const created = lastCall('productSet');
      expect(created?.variables.identifier).toBeUndefined();
      expect(created?.variables.input).toMatchObject({
        handle: 'publish-mug',
        title: 'Publish Mug',
        status: 'ACTIVE',
        variants: [
          {
            price: '102.99',
            inventoryQuantities: [
              { locationId: 'gid://shopify/Location/1', name: 'available', quantity: 10 },
            ],
          },
        ],
      });
      const listings = await request(server())
        .get(connectionPath(owner, connectionId, 'listings'))
        .set('Cookie', owner.cookie);
      expect(listings.body.items[0]).toMatchObject({
        status: ListingStatus.ACTIVE,
        externalId: PRODUCT_GID,
        lastError: null,
      });
      expect(listings.body.items[0].lastSyncedAt).not.toBeNull();

      // 2. A product edit updates the same Shopify product: never a duplicate.
      const edited = await request(server())
        .put(`${base(owner)}/products/${mug.id}`)
        .set('Cookie', owner.cookie)
        .send({
          handle: 'publish-mug',
          title: 'Publish Mug v2',
          status: ProductStatus.ACTIVE,
          tags: ['live'],
          media: mug.media.map(({ url }) => ({ url })),
          variants: mug.variants.map(({ id, sku, price }) => ({ id, sku, price, quantity: 12 })),
        });
      expect(edited.status).toBe(HttpStatus.OK);
      expectCalls(2);
      expect(new Set(await runQueued())).toEqual(
        new Set([SyncJobKind.Content, SyncJobKind.Inventory]),
      );
      const updated = lastCall('productSet');
      expect(updated?.variables.identifier).toEqual({ id: PRODUCT_GID });
      expect(updated?.variables.input).toMatchObject({ title: 'Publish Mug v2' });
      expect(updated?.variables.input).not.toHaveProperty('files');

      // 3. A stock adjustment fans out to the listing, minus its buffer.
      const inventory = await request(server())
        .get(`${base(owner)}/inventory-items`)
        .query({ search: mug.variants[0].sku })
        .set('Cookie', owner.cookie);
      await request(server())
        .post(
          `${base(owner)}/inventory-items/${inventory.body.items[0].inventoryItemId}/adjustments`,
        )
        .set('Cookie', owner.cookie)
        .send({
          mode: StockAdjustmentMode.Delta,
          quantity: 5,
          reason: InventoryMovementReason.RECEIVED,
        });
      expectCalls(1);
      expect(await runQueued()).toEqual([SyncJobKind.Inventory]);
      expect(lastCall('inventorySetQuantities')?.variables.input).toMatchObject({
        quantities: [{ quantity: 15, changeFromQuantity: null }],
      });

      // 4. Deselecting and syncing delists by archiving.
      await request(server())
        .put(connectionPath(owner, connectionId, 'product-selection'))
        .set('Cookie', owner.cookie)
        .send({ rule: { filter: null, includeProductIds: [], excludeProductIds: [] } });
      const resync = await request(server())
        .post(connectionPath(owner, connectionId, 'sync'))
        .set('Cookie', owner.cookie);
      expectCalls(1);
      expect(await runQueued()).toEqual([SyncJobKind.Delist]);
      expect(resync.body).toEqual({ queued: 0, delisting: 1 });
      expect(lastCall('productUpdate')?.variables).toEqual({
        product: { id: PRODUCT_GID, status: 'ARCHIVED' },
      });
      const delisted = await request(server())
        .get(`${base(owner)}/products/${mug.id}/channels`)
        .set('Cookie', owner.cookie);
      expect(delisted.body[0]).toMatchObject({
        selected: false,
        listing: { status: ListingStatus.DELISTED },
      });
      http.assertDone();

      const activity = await request(server())
        .get(`${base(owner)}/activity`)
        .set('Cookie', owner.cookie);
      const actions = (activity.body.items as { action: ActivityAction }[]).map(
        (item) => item.action,
      );
      expect(actions).toEqual(
        expect.arrayContaining([
          ActivityAction.ListingPublished,
          ActivityAction.ListingUpdated,
          ActivityAction.ListingDelisted,
          ActivityAction.ChannelSyncRequested,
        ]),
      );
    });

    it('stores Shopify’s user errors on the listing and logs the failure', async () => {
      const owner = await signUp(app, 'Rejected Seller');
      const shop = newShop();
      const connectionId = await connectShopifyStore(app, http, owner, shop);
      const product = await createProduct(owner, { title: 'Bad Product' });
      await request(server())
        .post(connectionPath(owner, connectionId, 'sync'))
        .set('Cookie', owner.cookie);
      answerGraphql(http, shop, () => ({ data: { location: { id: 'gid://shopify/Location/1' } } }));
      answerGraphql(http, shop, () => ({
        data: {
          productSet: {
            product: null,
            userErrors: [{ field: ['input', 'title'], message: 'Title is invalid' }],
          },
        },
      }));

      await runQueued();

      const channels = await request(server())
        .get(`${base(owner)}/products/${product.id}/channels`)
        .set('Cookie', owner.cookie);
      expect(channels.body[0].listing).toMatchObject({
        status: ListingStatus.ERROR,
        lastError: 'Title is invalid',
      });
      const activity = await request(server())
        .get(`${base(owner)}/activity`)
        .set('Cookie', owner.cookie);
      expect(activity.body.items[0]).toMatchObject({
        action: ActivityAction.ListingSyncFailed,
        failureReason: 'Title is invalid',
      });
    });
  });

  describe('tenant isolation', () => {
    it('keeps a workspace’s connections, rules, listings and overrides to itself', async () => {
      const owner = await signUp(app, 'Isolated Seller');
      const intruder = await signUp(app, 'Intruder');
      const connectionId = await connectShopifyStore(app, http, owner);
      const product = await createProduct(owner, { title: 'Private Product' });
      const intruderProduct = await createProduct(intruder, { title: 'Intruder Product' });
      const asIntruder = (method: 'get' | 'put' | 'post', path: string, body?: object) =>
        request(server())[method](path).set('Cookie', intruder.cookie).send(body);

      const throughOwnWorkspace = [
        await asIntruder('put', connectionPath(intruder, connectionId, 'pricing'), { rule: RULE }),
        await asIntruder(
          'post',
          connectionPath(intruder, connectionId, 'product-selection/preview'),
          { rule: null },
        ),
        await asIntruder('post', connectionPath(intruder, connectionId, 'sync')),
        await asIntruder('get', connectionPath(intruder, connectionId, 'listings')),
        await asIntruder(
          'put',
          `${base(intruder)}/products/${intruderProduct.id}/channels/${connectionId}/override`,
          {},
        ),
      ];
      const throughOwnerWorkspace = [
        await asIntruder('get', connectionPath(owner, connectionId, 'listings')),
        await asIntruder('get', `${base(owner)}/products/${product.id}/channels`),
      ];
      const ownPreview = await request(server())
        .post(connectionPath(owner, connectionId, 'product-selection/preview'))
        .set('Cookie', owner.cookie)
        .send({
          rule: { filter: null, includeProductIds: [intruderProduct.id], excludeProductIds: [] },
        });

      expect(throughOwnWorkspace.map((response) => response.status)).toEqual(
        Array(5).fill(HttpStatus.NOT_FOUND),
      );
      // The workspace guard does not reveal that another workspace exists.
      expect(throughOwnerWorkspace.map((response) => response.status)).toEqual([
        HttpStatus.NOT_FOUND,
        HttpStatus.NOT_FOUND,
      ]);
      // Another workspace's product id selects nothing.
      expect(ownPreview.body.total).toBe(0);
    });
  });
});
