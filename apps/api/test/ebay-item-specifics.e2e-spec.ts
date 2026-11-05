import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FakeHttpTransport, HttpMethod, HttpTransport, jsonResponse } from '@crossmart/connectors';
import { ActivityAction, ListingSyncRunner, SyncJobQueue } from '@crossmart/core';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import { connectEbayAccount, EBAY_API, EBAY_INVENTORY } from './support/ebay-account.js';
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

const NO_CONTENT = { status: 204, headers: {}, body: '' };
const TAXONOMY = `${EBAY_API}/commerce/taxonomy/v1`;
const CATEGORY = { id: '20625', name: 'Home & Garden > Kitchen > Mugs' };
const LISTING_ID = '110553007777';

function aspect(name: string, constraint: Record<string, unknown>, values: string[] = []) {
  return {
    localizedAspectName: name,
    aspectConstraint: {
      aspectRequired: false,
      aspectUsage: 'RECOMMENDED',
      aspectMode: 'FREE_TEXT',
      itemToAspectCardinality: 'SINGLE',
      ...constraint,
    },
    aspectValues: values.map((localizedValue) => ({ localizedValue })),
  };
}

/** Fabricated aspects of the Mugs category. */
const MUG_ASPECTS = {
  aspects: [
    aspect('Color', { itemToAspectCardinality: 'MULTI' }, ['Blue', 'White']),
    aspect('Brand', { aspectRequired: true }, ['Acme']),
    aspect('Material', { aspectRequired: true, aspectMode: 'SELECTION_ONLY' }, ['Stoneware']),
  ],
};

describe('eBay item specifics (e2e)', () => {
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

  async function runQueued(): Promise<void> {
    for (const job of queue.drain()) {
      await runner.run(job);
    }
  }

  async function readyConnection(owner: SignedUpUser): Promise<string> {
    const connectionId = await connectEbayAccount(app, http, owner, {
      userId: 'e2eSpecifics',
      withPolicies: true,
    });
    http.expect(HttpMethod.Post, `${EBAY_INVENTORY}/location/crossmart-default`, NO_CONTENT);
    await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/ebay/listing-defaults`)
      .set('Cookie', owner.cookie)
      .send({
        fulfillmentPolicyId: null,
        paymentPolicyId: null,
        returnPolicyId: null,
        condition: 'NEW',
        location: { postalCode: '95125', country: 'US', city: null },
      })
      .expect(HttpStatus.OK);
    return connectionId;
  }

  async function createMug(owner: SignedUpUser, sku: string): Promise<string> {
    const response = await request(server())
      .post(`${base(owner)}/products`)
      .set('Cookie', owner.cookie)
      .send({
        title: 'Stoneware mug',
        vendor: 'Acme',
        status: ProductStatus.ACTIVE,
        media: [{ url: 'https://cdn.example.com/mug.jpg' }],
        variants: [{ sku, price: '12.00', quantity: 4 }],
      })
      .expect(HttpStatus.CREATED);
    return (response.body as { id: string }).id;
  }

  async function listingOf(owner: SignedUpUser, productId: string, connectionId: string) {
    const response = await request(server())
      .get(`${base(owner)}/products/${productId}/channels`)
      .set('Cookie', owner.cookie);
    const views = response.body as {
      connection: { id: string };
      listing: { status: ListingStatus; lastError: string | null } | null;
    }[];
    return views.find((view) => view.connection.id === connectionId)?.listing;
  }

  it('shows the category’s item specifics, fails early without required ones, then publishes them', async () => {
    const owner = await signUp(app, 'eBay Specifics');
    const connectionId = await readyConnection(owner);
    const sku = `SPEC-${Date.now()}`;
    const productId = await createMug(owner, sku);
    const channelPath = `${base(owner)}/products/${productId}/channels/${connectionId}`;

    // No category yet: nothing to ask eBay about.
    const empty = await request(server())
      .get(`${channelPath}/item-specifics`)
      .set('Cookie', owner.cookie)
      .expect(HttpStatus.OK);
    expect(empty.body).toEqual({ category: null, aspects: [], itemSpecifics: [] });

    await request(server())
      .put(`${channelPath}/category`)
      .set('Cookie', owner.cookie)
      .send({ category: CATEGORY })
      .expect(HttpStatus.OK);
    http
      .expect(
        HttpMethod.Get,
        `${TAXONOMY}/get_default_category_tree_id?marketplace_id=EBAY_US`,
        jsonResponse({ categoryTreeId: '0' }),
      )
      .expect(
        HttpMethod.Get,
        `${TAXONOMY}/category_tree/0/get_item_aspects_for_category?category_id=20625`,
        jsonResponse(MUG_ASPECTS),
      );
    const shown = await request(server())
      .get(`${channelPath}/item-specifics`)
      .set('Cookie', owner.cookie)
      .expect(HttpStatus.OK);
    http.assertDone();
    expect(shown.body.category).toEqual(CATEGORY);
    expect(shown.body.itemSpecifics).toEqual([]);
    expect(shown.body.aspects).toEqual([
      {
        name: 'Brand',
        required: true,
        usage: 'recommended',
        mode: 'free_text',
        multiple: false,
        values: ['Acme'],
      },
      {
        name: 'Material',
        required: true,
        usage: 'recommended',
        mode: 'selection_only',
        multiple: false,
        values: ['Stoneware'],
      },
      {
        name: 'Color',
        required: false,
        usage: 'recommended',
        mode: 'free_text',
        multiple: true,
        values: ['Blue', 'White'],
      },
    ]);

    // Publishing without Material fails before any write to eBay (the aspects are cached).
    await request(server()).post(channelPath).set('Cookie', owner.cookie);
    await runQueued();
    expect(http.requests.at(-1)?.url).toContain('get_item_aspects_for_category');
    expect(await listingOf(owner, productId, connectionId)).toMatchObject({
      status: ListingStatus.ERROR,
      lastError: expect.stringContaining('item specifics in this category: Material.'),
    });

    // Saving the specifics sends the failed listing again, with them.
    const saved = await request(server())
      .put(`${channelPath}/item-specifics`)
      .set('Cookie', owner.cookie)
      .send({
        itemSpecifics: [
          { name: 'Material', values: ['Stoneware'] },
          { name: 'Color', values: ['Blue', ' White ', ''] },
          { name: 'Features', values: [] },
        ],
      })
      .expect(HttpStatus.OK);
    expect(saved.body.itemSpecifics).toEqual([
      { name: 'Color', values: ['Blue', 'White'] },
      { name: 'Material', values: ['Stoneware'] },
    ]);
    http
      .expect(HttpMethod.Put, `${EBAY_INVENTORY}/inventory_item/${sku}`, NO_CONTENT)
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${sku}&`), jsonResponse({}, 404))
      .expect(HttpMethod.Post, `${EBAY_INVENTORY}/offer`, jsonResponse({ offerId: 'o-7' }, 201))
      .expect(
        HttpMethod.Post,
        `${EBAY_INVENTORY}/offer/o-7/publish`,
        jsonResponse({ listingId: LISTING_ID }),
      );
    await runQueued();
    http.assertDone();
    const item = http.requests.find((call) => call.url.endsWith(`/inventory_item/${sku}`));
    expect(JSON.parse(item?.body ?? '{}').product.aspects).toEqual({
      Brand: ['Acme'],
      Color: ['Blue', 'White'],
      Material: ['Stoneware'],
    });
    expect((await listingOf(owner, productId, connectionId))?.status).toBe(ListingStatus.ACTIVE);

    const activity = await request(server())
      .get(`${base(owner)}/activity`)
      .set('Cookie', owner.cookie);
    const actions = (activity.body.items as { action: ActivityAction }[]).map(
      (entry) => entry.action,
    );
    expect(actions).toContain(ActivityAction.ListingItemSpecificsChanged);
  });

  it('refuses item specifics that are too long or given twice', async () => {
    const owner = await signUp(app, 'eBay Specifics Limits');
    const connectionId = await connectEbayAccount(app, http, owner, {
      userId: 'e2eSpecificsLimits',
      withPolicies: true,
    });
    const productId = await createMug(owner, `LIM-${Date.now()}`);
    const path = `${base(owner)}/products/${productId}/channels/${connectionId}/item-specifics`;

    const tooLong = await request(server())
      .put(path)
      .set('Cookie', owner.cookie)
      .send({ itemSpecifics: [{ name: 'Material', values: ['x'.repeat(51)] }] });
    expect(tooLong.status).toBe(HttpStatus.BAD_REQUEST);

    const twice = await request(server())
      .put(path)
      .set('Cookie', owner.cookie)
      .send({
        itemSpecifics: [
          { name: 'Color', values: ['Blue'] },
          { name: 'color', values: ['Red'] },
        ],
      });
    expect(twice.status).toBe(HttpStatus.BAD_REQUEST);
    expect(twice.body.message).toContain('Set each item specific once');
  });
});
