import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { FakeHttpTransport, HttpTransport, PublishRequirement } from '@crossmart/connectors';
import {
  ActivityAction,
  AgentProposalStatus,
  AgentProposerKind,
  AttentionStoreReason,
  ListingSyncRunner,
  SuggestionKind,
  SyncJobKind,
  SyncJobQueue,
  WorkspacePermission,
} from '@crossmart/core';
import {
  ChannelConnectionStatus,
  InventoryMovementReason,
  ListingStatus,
  PrismaService,
  ProductCondition,
  ProductStatus,
  SuggestionCreatorType,
  SuggestionStatus,
  WorkspaceRole,
} from '@crossmart/database';
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

const SHOPIFY_PRODUCT = 'gid://shopify/Product/990001';
/** Enough fake replies for a publish, a delist and the stock syncs around them. */
const SHOPIFY_REPLIES = 6;

interface CreatedProduct {
  id: string;
  title: string;
  condition: string | null;
  handle: string;
  variants: { id: string; sku: string; price: string; available: number }[];
}

/** Answers each Admin API call the way Shopify would, by the operation it is. */
function shopifyReply(call: GraphqlCall): unknown {
  if (call.query.includes('productSet')) {
    const input = call.variables.input as { variants: { position: number }[] };
    const variants = input.variants.map((variant) => ({
      id: `gid://shopify/ProductVariant/99${variant.position}`,
      position: variant.position,
      inventoryItem: { id: `gid://shopify/InventoryItem/99${variant.position}` },
    }));
    return {
      data: {
        productSet: {
          product: {
            id: SHOPIFY_PRODUCT,
            status: 'ACTIVE',
            onlineStoreUrl: null,
            variants: { nodes: variants },
          },
          userErrors: [],
        },
      },
    };
  }
  if (call.query.includes('inventorySetQuantities')) {
    return { data: { inventorySetQuantities: { userErrors: [] } } };
  }
  if (call.query.includes('productUpdate')) return { data: { productUpdate: { userErrors: [] } } };
  return { data: { location: { id: 'gid://shopify/Location/1' } } };
}

describe('Reseller workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let runner: ListingSyncRunner;
  const http = new FakeHttpTransport();
  const queue = new RecordingSyncJobQueue();

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(SyncJobQueue)
        .useValue(queue),
    );
    prisma = app.get(PrismaService);
    runner = app.get(ListingSyncRunner);
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const base = (user: SignedUpUser) => `/api/v1/workspaces/${user.workspaceId}`;

  async function createProduct(
    user: SignedUpUser,
    input: { title: string; condition?: ProductCondition; quantity?: number },
  ): Promise<CreatedProduct> {
    const response = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: input.title,
        status: ProductStatus.ACTIVE,
        condition: input.condition,
        media: [{ url: 'https://cdn.example.com/item.jpg' }],
        variants: [
          { sku: `SKU-${randomUUID().slice(0, 8)}`, price: '45.00', quantity: input.quantity ?? 1 },
        ],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body as CreatedProduct;
  }

  async function addToStore(user: SignedUpUser, productId: string, connectionId: string) {
    const added = await request(server())
      .post(`${base(user)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', user.cookie);
    expect(added.status).toBe(HttpStatus.CREATED);
  }

  async function runQueued(): Promise<SyncJobKind[]> {
    const jobs = queue.drain();
    for (const job of jobs) await runner.run(job);
    return jobs.map((job) => job.kind);
  }

  async function keyWithRole(owner: SignedUpUser, role: object): Promise<string> {
    const created = await request(server())
      .post(`${base(owner)}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Key', ...role });
    expect(created.status).toBe(HttpStatus.CREATED);
    return created.body.secret as string;
  }

  describe('item condition', () => {
    it('is set on create, kept when an update leaves it out, cleared with null, and validated', async () => {
      const owner = await signUp(app, 'Condition Owner');
      const jacket = await createProduct(owner, {
        title: 'Vintage Denim Jacket',
        condition: ProductCondition.USED_GOOD,
      });
      const path = `${base(owner)}/products/${jacket.id}`;
      const replace = (body: object) =>
        request(server())
          .put(path)
          .set('Cookie', owner.cookie)
          .send({
            handle: jacket.handle,
            title: jacket.title,
            variants: [{ id: jacket.variants[0]?.id, price: '45.00' }],
            ...body,
          });

      expect(jacket.condition).toBe(ProductCondition.USED_GOOD);
      expect((await replace({})).body.condition).toBe(ProductCondition.USED_GOOD);
      const listed = await request(server())
        .get(`${base(owner)}/products`)
        .query({ search: 'Vintage Denim' })
        .set('Cookie', owner.cookie);
      expect(listed.body.items[0].condition).toBe(ProductCondition.USED_GOOD);
      expect((await replace({ condition: ProductCondition.LIKE_NEW })).body.condition).toBe(
        ProductCondition.LIKE_NEW,
      );
      expect((await replace({ condition: null })).body.condition).toBeNull();
      expect((await replace({ condition: 'GENTLY_LOVED' })).status).toBe(HttpStatus.BAD_REQUEST);
    });
  });

  describe('mark as sold', () => {
    it('clears the stock, ends the listing on every store, logs it, and is idempotent', async () => {
      const owner = await signUp(app, 'Sold Owner');
      const shop = newShop();
      const connectionId = await connectShopifyStore(app, http, owner, shop);
      const jacket = await createProduct(owner, { title: 'One-off Leather Jacket', quantity: 1 });
      await addToStore(owner, jacket.id, connectionId);
      answerGraphql(http, shop, shopifyReply, SHOPIFY_REPLIES);
      await runQueued();
      const markSold = () =>
        request(server())
          .post(`${base(owner)}/products/${jacket.id}/mark-sold`)
          .set('Cookie', owner.cookie);

      const sold = await markSold();

      expect(sold.status).toBe(HttpStatus.OK);
      expect(sold.body).toMatchObject({
        unitsCleared: 1,
        alreadySold: false,
        removedFromStores: [{ connectionId, channel: 'shopify', displayName: 'E2E Store' }],
        product: { id: jacket.id, variants: [{ available: 0 }] },
      });
      expect(await runQueued()).toContain(SyncJobKind.Delist);
      const listing = await prisma.listing.findFirst({ where: { productId: jacket.id } });
      expect(listing?.status).toBe(ListingStatus.DELISTED);
      const movement = await prisma.inventoryMovement.findFirst({
        where: { inventoryItem: { variantId: jacket.variants[0]?.id } },
        orderBy: { createdAt: 'desc' },
      });
      expect(movement).toMatchObject({ reason: InventoryMovementReason.SOLD, delta: -1 });
      const activity = await request(server())
        .get(`${base(owner)}/activity`)
        .set('Cookie', owner.cookie);
      // The delist job logs its own event after the sale.
      expect(activity.body.items).toContainEqual(
        expect.objectContaining({
          action: ActivityAction.ProductMarkedSold,
          summary: 'Marked “One-off Leather Jacket” sold, clearing 1 unit',
        }),
      );

      const again = await markSold();
      expect(again.body).toMatchObject({
        unitsCleared: 0,
        removedFromStores: [],
        alreadySold: true,
      });
      expect(queue.drain()).toEqual([]);
    });

    it('needs products:edit, and finds no product outside the workspace', async () => {
      const owner = await signUp(app, 'Sold Permissions');
      const stranger = await signUp(app, 'Sold Stranger');
      const mug = await createProduct(owner, { title: 'Studio Mug' });
      const viewerKey = await keyWithRole(owner, { role: WorkspaceRole.VIEWER });

      const asViewer = await request(server())
        .post(`${base(owner)}/products/${mug.id}/mark-sold`)
        .set(API_KEY_HEADER, viewerKey);
      const foreign = await request(server())
        .post(`${base(stranger)}/products/${mug.id}/mark-sold`)
        .set('Cookie', stranger.cookie);

      expect(asViewer.status).toBe(HttpStatus.FORBIDDEN);
      expect(asViewer.body.message).toBe(
        `Requires the ${WorkspacePermission.EditProducts} permission`,
      );
      expect(foreign.status).toBe(HttpStatus.NOT_FOUND);
      const stock = await prisma.inventoryItem.findFirst({
        where: { variantId: mug.variants[0]?.id },
      });
      expect(stock?.available).toBe(1);
    });
  });

  describe('attention summary', () => {
    async function seedAttention(owner: SignedUpUser) {
      const [reauthId, healthyId, goneId] = [
        await connectShopifyStore(app, http, owner),
        await connectShopifyStore(app, http, owner),
        await connectShopifyStore(app, http, owner),
      ];
      const failing = await createProduct(owner, { title: 'Corduroy Blazer' });
      const stranded = await createProduct(owner, { title: 'Wool Scarf' });
      await addToStore(owner, failing.id, healthyId);
      await addToStore(owner, stranded.id, goneId);
      queue.drain();
      await prisma.listing.updateMany({
        where: { productId: failing.id },
        data: {
          status: ListingStatus.ERROR,
          lastError: 'Add Brand',
          missingRequirement: PublishRequirement.ItemSpecifics,
        },
      });
      await prisma.channelConnection.update({
        where: { id: reauthId },
        data: { status: ChannelConnectionStatus.NEEDS_REAUTH, statusReason: 'Connect again' },
      });
      await prisma.channelConnection.update({
        where: { id: goneId },
        data: { status: ChannelConnectionStatus.DISCONNECTED },
      });
      await seedReviews(owner, failing.id, healthyId);
      return { reauthId, healthyId, goneId, failing };
    }

    /** A pending AI suggestion and a pending outside-agent proposal. */
    async function seedReviews(owner: SignedUpUser, productId: string, connectionId: string) {
      const user = await prisma.user.findUniqueOrThrow({ where: { email: owner.email } });
      await prisma.suggestion.create({
        data: {
          workspaceId: owner.workspaceId,
          productId,
          connectionId,
          kind: SuggestionKind.ListingTitle,
          currentValue: 'Corduroy Blazer',
          proposedValue: 'Vintage Corduroy Blazer, Brown, Size M',
          rationale: 'Names the era, color and size buyers search for.',
          createdByType: SuggestionCreatorType.USER,
          requestedByUserId: user.id,
        },
      });
      await prisma.agentProposal.create({
        data: {
          workspaceId: owner.workspaceId,
          proposerKind: AgentProposerKind.OAuthAgent,
          userId: user.id,
          agentName: 'Claude',
          scopes: [],
          toolName: 'update_product_text',
          input: { productId, title: 'Blazer' },
          risks: [],
          summary: 'Change the title of a product',
          status: AgentProposalStatus.Pending,
          expiresAt: new Date(Date.now() + 3_600_000),
        },
      });
    }

    it('counts what needs attention exactly as the pages it links to', async () => {
      const owner = await signUp(app, 'Attention Owner');
      const { reauthId, healthyId, goneId, failing } = await seedAttention(owner);
      const get = (path: string, query: object = {}) =>
        request(server())
          .get(`${base(owner)}/${path}`)
          .query(query)
          .set('Cookie', owner.cookie);

      const [attention, stores, proposals, suggestions] = await Promise.all([
        get('attention'),
        get('channel-connections'),
        get('agent-proposals/summary'),
        get('suggestions', { status: SuggestionStatus.PENDING }),
      ]);

      expect(attention.status).toBe(HttpStatus.OK);
      const failedOnStores = (stores.body as { failedListings: number }[]).reduce(
        (sum, store) => sum + store.failedListings,
        0,
      );
      expect(attention.body.listings.count).toBe(failedOnStores);
      expect(attention.body.proposals.count).toBe(proposals.body.pendingCount);
      expect(attention.body.suggestions.count).toBe(suggestions.body.total);
      expect(attention.body.total).toBe(2 + 1 + 1 + 1);
      expect(attention.body.stores.items).toEqual([
        expect.objectContaining({
          connectionId: reauthId,
          reason: AttentionStoreReason.NeedsReauth,
          statusReason: 'Connect again',
        }),
        expect.objectContaining({
          connectionId: goneId,
          reason: AttentionStoreReason.DisconnectedWithListings,
          liveListings: 1,
        }),
      ]);
      expect(attention.body.listings.items).toEqual([
        expect.objectContaining({
          productId: failing.id,
          productTitle: 'Corduroy Blazer',
          connectionId: healthyId,
          failedListings: 1,
          lastError: 'Add Brand',
          missingRequirement: PublishRequirement.ItemSpecifics,
        }),
      ]);
      expect(attention.body.proposals.items[0]).toMatchObject({ agentName: 'Claude' });
      expect(attention.body.suggestions.items[0]).toMatchObject({
        productTitle: 'Corduroy Blazer',
      });
    });

    it('keeps to the workspace, validates the limit, and hides what the caller may not see', async () => {
      const owner = await signUp(app, 'Attention Isolation');
      await seedAttention(owner);
      const stranger = await signUp(app, 'Attention Stranger');
      const role = await request(server())
        .post(`${base(owner)}/roles`)
        .set('Cookie', owner.cookie)
        .send({ name: 'Store watcher', permissions: [WorkspacePermission.ViewChannels] });
      const watcherKey = await keyWithRole(owner, {
        role: WorkspaceRole.CUSTOM,
        customRoleId: role.body.id,
      });
      const attentionOf = (user: SignedUpUser) =>
        request(server())
          .get(`${base(user)}/attention`)
          .set('Cookie', stranger.cookie);

      const foreign = await attentionOf(owner);
      const own = await attentionOf(stranger);
      const tooMany = await request(server())
        .get(`${base(owner)}/attention`)
        .query({ limit: 21 })
        .set('Cookie', owner.cookie);
      const limited = await request(server())
        .get(`${base(owner)}/attention`)
        .query({ limit: 1 })
        .set('Cookie', owner.cookie);
      const asWatcher = await request(server())
        .get(`${base(owner)}/attention`)
        .set(API_KEY_HEADER, watcherKey);

      expect(foreign.status).toBe(HttpStatus.NOT_FOUND);
      expect(own.body).toMatchObject({ total: 0, stores: { count: 0 }, listings: { count: 0 } });
      expect(tooMany.status).toBe(HttpStatus.BAD_REQUEST);
      expect(limited.body.stores).toMatchObject({ count: 2 });
      expect(limited.body.stores.items).toHaveLength(1);
      expect(asWatcher.status).toBe(HttpStatus.OK);
      expect(asWatcher.body).toMatchObject({ total: 3, proposals: null, suggestions: null });
    });
  });
});
