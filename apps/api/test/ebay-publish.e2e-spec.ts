import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FakeHttpTransport, HttpMethod, HttpTransport, jsonResponse } from '@crossmart/connectors';
import { ActivityAction, ListingSyncRunner, SyncJobQueue } from '@crossmart/core';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import {
  connectEbayAccount,
  EBAY_API,
  EBAY_INVENTORY,
  expectEbayPolicies,
  expectEbayUser,
} from './support/ebay-account.js';
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
const LISTING_ID = '110553009999';
const CATEGORY = { id: '20625', name: 'Home & Garden > Kitchen > Mugs' };

interface ProductChannelBody {
  connection: { id: string };
  listing: {
    status: ListingStatus;
    externalId: string | null;
    externalUrl: string | null;
    lastError: string | null;
    category: { id: string; name: string } | null;
  } | null;
}

describe('eBay publishing (e2e)', () => {
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

  async function createMug(user: SignedUpUser, sku: string): Promise<string> {
    const response = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: 'Stoneware mug',
        vendor: 'Acme',
        status: ProductStatus.ACTIVE,
        media: [{ url: 'https://cdn.example.com/mug.jpg' }],
        variants: [{ sku, price: '12.00', quantity: 4 }],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return (response.body as { id: string }).id;
  }

  async function runQueued(): Promise<void> {
    for (const job of queue.drain()) {
      await runner.run(job);
    }
  }

  async function productChannel(
    user: SignedUpUser,
    productId: string,
    connectionId: string,
  ): Promise<ProductChannelBody> {
    const response = await request(server())
      .get(`${base(user)}/products/${productId}/channels`)
      .set('Cookie', user.cookie);
    const views = response.body as ProductChannelBody[];
    const view = views.find((entry) => entry.connection.id === connectionId);
    if (!view) throw new Error('The product has no view on the eBay connection');
    return view;
  }

  function addToStore(user: SignedUpUser, productId: string, connectionId: string) {
    return request(server())
      .post(`${base(user)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', user.cookie);
  }

  it('saves defaults, publishes a product in the suggested category, updates and ends it', async () => {
    const owner = await signUp(app, 'eBay Publisher');
    const connectionId = await connectEbayAccount(app, http, owner, {
      userId: 'e2ePublisher',
      withPolicies: true,
    });

    http.expect(HttpMethod.Post, `${EBAY_INVENTORY}/location/crossmart-default`, NO_CONTENT);
    const defaults = await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/ebay/listing-defaults`)
      .set('Cookie', owner.cookie)
      .send({
        fulfillmentPolicyId: null,
        paymentPolicyId: 'p-1',
        returnPolicyId: null,
        condition: 'NEW',
        location: { postalCode: '95125', country: 'US', city: null },
      });
    expect(defaults.status).toBe(HttpStatus.OK);
    expect(defaults.body.ebay).toMatchObject({
      readyToList: true,
      listingDefaults: {
        fulfillmentPolicyId: 'f-1',
        paymentPolicyId: 'p-1',
        returnPolicyId: 'r-1',
        merchantLocationKey: 'crossmart-default',
      },
    });

    const sku = `MUG-${Date.now()}`;
    const productId = await createMug(owner, sku);
    http
      .expect(
        HttpMethod.Get,
        `${EBAY_API}/commerce/taxonomy/v1/get_default_category_tree_id?marketplace_id=EBAY_US`,
        jsonResponse({ categoryTreeId: '0' }),
      )
      .expect(
        HttpMethod.Get,
        /get_category_suggestions\?q=Stoneware\+mug$/,
        jsonResponse({
          categorySuggestions: [
            {
              category: { categoryId: '20625', categoryName: 'Mugs' },
              categoryTreeNodeAncestors: [
                { categoryName: 'Kitchen', categoryTreeNodeLevel: 2 },
                { categoryName: 'Home & Garden', categoryTreeNodeLevel: 1 },
              ],
            },
          ],
        }),
      )
      .expect(HttpMethod.Put, `${EBAY_INVENTORY}/inventory_item/${sku}`, NO_CONTENT)
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${sku}&`), jsonResponse({}, 404))
      .expect(HttpMethod.Post, `${EBAY_INVENTORY}/offer`, jsonResponse({ offerId: 'o-1' }, 201))
      .expect(
        HttpMethod.Post,
        `${EBAY_INVENTORY}/offer/o-1/publish`,
        jsonResponse({ listingId: LISTING_ID }),
      );

    expect((await addToStore(owner, productId, connectionId)).status).toBe(HttpStatus.CREATED);
    await runQueued();

    http.assertDone();
    const listed = await productChannel(owner, productId, connectionId);
    expect(listed.listing).toEqual(
      expect.objectContaining({
        status: ListingStatus.ACTIVE,
        externalId: LISTING_ID,
        externalUrl: `https://sandbox.ebay.com/itm/${LISTING_ID}`,
        lastError: null,
        category: CATEGORY,
      }),
    );
    const offer = JSON.parse(
      http.requests.find((call) => call.url.endsWith('/offer'))?.body ?? '{}',
    );
    expect(offer).toMatchObject({
      sku,
      categoryId: '20625',
      merchantLocationKey: 'crossmart-default',
      pricingSummary: { price: { value: '12.00', currency: 'USD' } },
      listingPolicies: {
        fulfillmentPolicyId: 'f-1',
        paymentPolicyId: 'p-1',
        returnPolicyId: 'r-1',
      },
    });

    // The merchant searches for another category and picks it: the listing is revised.
    http.expect(
      HttpMethod.Get,
      /category_tree\/0\/get_category_suggestions\?q=coffee\+cup$/,
      jsonResponse({
        categorySuggestions: [{ category: { categoryId: '177', categoryName: 'Cups' } }],
      }),
    );
    const suggestions = await request(server())
      .get(`${base(owner)}/products/${productId}/channels/${connectionId}/category-suggestions`)
      .query({ search: 'coffee cup' })
      .set('Cookie', owner.cookie);
    expect(suggestions.body).toEqual([{ id: '177', name: 'Cups' }]);

    const chosen = await request(server())
      .put(`${base(owner)}/products/${productId}/channels/${connectionId}/category`)
      .set('Cookie', owner.cookie)
      .send({ category: { id: '177', name: 'Cups' } });
    expect(chosen.status).toBe(HttpStatus.OK);
    expect(chosen.body.listing.category).toEqual({ id: '177', name: 'Cups' });
    const existingOffer = jsonResponse({
      offers: [{ offerId: 'o-1', sku, status: 'PUBLISHED', listing: { listingId: LISTING_ID } }],
    });
    http
      .expect(HttpMethod.Put, `${EBAY_INVENTORY}/inventory_item/${sku}`, NO_CONTENT)
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${sku}&`), existingOffer)
      .expect(HttpMethod.Put, `${EBAY_INVENTORY}/offer/o-1`, NO_CONTENT)
      .expect(
        HttpMethod.Post,
        `${EBAY_INVENTORY}/offer/o-1/publish`,
        jsonResponse({ listingId: LISTING_ID }),
      );
    await runQueued();
    http.assertDone();
    expect(JSON.parse(http.requests.at(-2)?.body ?? '{}')).toMatchObject({ categoryId: '177' });

    // Removed from the store: the offer is withdrawn and the listing delisted.
    http
      .expect(HttpMethod.Get, new RegExp(`/offer\\?sku=${sku}&`), existingOffer)
      .expect(HttpMethod.Post, `${EBAY_INVENTORY}/offer/o-1/withdraw`, jsonResponse({}));
    await request(server())
      .delete(`${base(owner)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', owner.cookie);
    await runQueued();
    http.assertDone();
    expect((await productChannel(owner, productId, connectionId)).listing?.status).toBe(
      ListingStatus.DELISTED,
    );

    const activity = await request(server())
      .get(`${base(owner)}/activity`)
      .set('Cookie', owner.cookie);
    const actions = (activity.body.items as { action: ActivityAction }[]).map(
      (item) => item.action,
    );
    expect(actions).toEqual(
      expect.arrayContaining([
        ActivityAction.ChannelListingDefaultsUpdated,
        ActivityAction.ListingPublished,
        ActivityAction.ListingCategoryChanged,
        ActivityAction.ListingDelisted,
      ]),
    );
  });

  it('fails a listing without policies, then opts in and reads them', async () => {
    const owner = await signUp(app, 'eBay Newcomer');
    const connectionId = await connectEbayAccount(app, http, owner, {
      userId: 'e2eNewcomer',
      withPolicies: false,
    });
    const productId = await createMug(owner, `CUP-${Date.now()}`);

    await addToStore(owner, productId, connectionId);
    await runQueued();

    expect(http.requests.at(-1)?.url).not.toContain('/sell/inventory/');
    const failed = await productChannel(owner, productId, connectionId);
    expect(failed.listing).toMatchObject({
      status: ListingStatus.ERROR,
      lastError: 'Choose shipping, payment and return policies for this eBay connection.',
    });

    http.expect(HttpMethod.Post, `${EBAY_API}/sell/account/v1/program/opt_in`, jsonResponse({}));
    expectEbayUser(http, 'e2eNewcomer');
    expectEbayPolicies(http);
    const optedIn = await request(server())
      .post(`${base(owner)}/channel-connections/${connectionId}/ebay/business-policies/opt-in`)
      .set('Cookie', owner.cookie);

    http.assertDone();
    expect(optedIn.status).toBe(HttpStatus.OK);
    expect(optedIn.body.ebay).toMatchObject({
      businessPoliciesEnabled: true,
      readyToList: false,
      listingDefaults: { fulfillmentPolicyId: 'f-1', merchantLocationKey: null },
    });
  });

  it('rejects policies the account does not have and countries that are not ISO codes', async () => {
    const owner = await signUp(app, 'eBay Validator');
    const connectionId = await connectEbayAccount(app, http, owner, {
      userId: 'e2eValidator',
      withPolicies: true,
    });
    const path = `${base(owner)}/channel-connections/${connectionId}/ebay/listing-defaults`;

    const unknown = await request(server())
      .put(path)
      .set('Cookie', owner.cookie)
      .send({ fulfillmentPolicyId: 'f-9', condition: 'NEW', location: null });
    const badCountry = await request(server())
      .put(path)
      .set('Cookie', owner.cookie)
      .send({ condition: 'NEW', location: { postalCode: '1', country: 'usa' } });

    expect(unknown.status).toBe(HttpStatus.BAD_REQUEST);
    expect(badCountry.status).toBe(HttpStatus.BAD_REQUEST);
    expect(http.requests.at(-1)?.url).not.toContain('/location/');
  });

  it('keeps the listing defaults when the account is connected again', async () => {
    const owner = await signUp(app, 'eBay Returner');
    const options = { userId: 'e2eReturner', withPolicies: true };
    const connectionId = await connectEbayAccount(app, http, owner, options);
    http.expect(HttpMethod.Post, `${EBAY_INVENTORY}/location/crossmart-default`, NO_CONTENT);
    await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/ebay/listing-defaults`)
      .set('Cookie', owner.cookie)
      .send({ condition: 'USED_GOOD', location: { postalCode: '10001', country: 'US' } });

    expect(await connectEbayAccount(app, http, owner, options)).toBe(connectionId);

    const list = await request(server())
      .get(`${base(owner)}/channel-connections`)
      .set('Cookie', owner.cookie);
    expect(list.body[0].ebay.listingDefaults).toMatchObject({
      condition: 'USED_GOOD',
      location: { postalCode: '10001', country: 'US', city: null },
      merchantLocationKey: 'crossmart-default',
    });
  });
});
