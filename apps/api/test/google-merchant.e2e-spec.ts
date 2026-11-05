import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { FakeHttpTransport, HttpMethod, HttpTransport, jsonResponse } from '@crossmart/connectors';
import { ListingSyncRunner, SyncJobQueue } from '@crossmart/core';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import {
  connectGoogleMerchant,
  GOOGLE_API,
  MERCHANT_ACCOUNT_ID,
} from './support/google-merchant-account.js';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

const WEB_APP_URL = 'http://localhost:5183';

// Fake Google app settings, set before the app module reads them.
vi.hoisted(() => {
  Object.assign(process.env, {
    GOOGLE_CLIENT_ID: 'e2e-client.apps.googleusercontent.com',
    GOOGLE_CLIENT_SECRET: 'e2e-google-secret',
    API_PUBLIC_URL: 'http://localhost:3010',
    WEB_APP_URL: 'http://localhost:5183',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const DATA_SOURCE_ID = '10462800';
const DATA_SOURCE_QUERY = `dataSource=accounts%2F${MERCHANT_ACCOUNT_ID}%2FdataSources%2F${DATA_SOURCE_ID}`;
const PRODUCTS = `${GOOGLE_API}/products/v1/accounts/${MERCHANT_ACCOUNT_ID}`;

interface ProductChannelBody {
  connection: { id: string };
  listing: { status: ListingStatus; externalId: string | null; lastError: string | null } | null;
}

describe('Google Merchant Center (e2e)', () => {
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

  async function listing(user: SignedUpUser, productId: string, connectionId: string) {
    const response = await request(server())
      .get(`${base(user)}/products/${productId}/channels`)
      .set('Cookie', user.cookie);
    const views = response.body as ProductChannelBody[];
    return views.find((view) => view.connection.id === connectionId)?.listing ?? null;
  }

  it('connects, sets up the country and product links, publishes and removes an offer', async () => {
    const owner = await signUp(app, 'Google Merchant');
    const connectionId = await connectGoogleMerchant(app, http, owner, WEB_APP_URL);

    const connections = await request(server())
      .get(`${base(owner)}/channel-connections`)
      .set('Cookie', owner.cookie);
    expect(connections.body[0]).toMatchObject({
      displayName: 'Acme Goods',
      googleMerchant: {
        accountId: MERCHANT_ACCOUNT_ID,
        country: 'DE',
        currencyCode: 'EUR',
        readyToList: false,
      },
    });

    http.expect(
      HttpMethod.Post,
      `${GOOGLE_API}/datasources/v1/accounts/${MERCHANT_ACCOUNT_ID}/dataSources`,
      jsonResponse({ dataSourceId: DATA_SOURCE_ID }),
    );
    const setup = await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/google-merchant/listing-setup`)
      .set('Cookie', owner.cookie)
      .send({ country: 'DE', productUrlTemplate: 'https://acme.example/products/{handle}' });
    expect(setup.status).toBe(HttpStatus.OK);
    expect(setup.body.googleMerchant).toMatchObject({
      readyToList: true,
      listingSetup: { country: 'DE', dataSourceId: DATA_SOURCE_ID },
    });

    const sku = `MUG-${Date.now()}`;
    const created = await request(server())
      .post(`${base(owner)}/products`)
      .set('Cookie', owner.cookie)
      .send({
        title: 'Stoneware mug',
        handle: 'stoneware-mug',
        descriptionHtml: '<p>Hand <em>glazed</em>.</p>',
        vendor: 'Acme',
        status: ProductStatus.ACTIVE,
        media: [{ url: 'https://cdn.example.com/mug.jpg' }],
        variants: [{ sku, price: '12.00', quantity: 4 }],
      });
    const productId = (created.body as { id: string }).id;

    http.expect(
      HttpMethod.Post,
      `${PRODUCTS}/productInputs:insert?${DATA_SOURCE_QUERY}`,
      jsonResponse({ offerId: sku }),
    );
    await request(server())
      .post(`${base(owner)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', owner.cookie);
    await runQueued();
    http.assertDone();
    expect(await listing(owner, productId, connectionId)).toMatchObject({
      status: ListingStatus.ACTIVE,
      externalId: productId,
      lastError: null,
    });
    expect(JSON.parse(http.requests.at(-1)?.body ?? '{}')).toMatchObject({
      offerId: sku,
      contentLanguage: 'de',
      feedLabel: 'DE',
      productAttributes: {
        title: 'Stoneware mug',
        description: 'Hand glazed.',
        link: 'https://acme.example/products/stoneware-mug',
        imageLink: 'https://cdn.example.com/mug.jpg',
        availability: 'IN_STOCK',
        // The workspace prices in USD; the store sells in EUR, converted at the day's rate.
        price: { amountMicros: expect.stringMatching(/^\d+$/), currencyCode: 'EUR' },
        brand: 'Acme',
      },
    });

    http.expect(
      HttpMethod.Delete,
      new RegExp(`${PRODUCTS}/productInputs/[\\w-]+\\?${DATA_SOURCE_QUERY}$`),
      jsonResponse({}),
    );
    await request(server())
      .delete(`${base(owner)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', owner.cookie);
    await runQueued();
    http.assertDone();
    expect((await listing(owner, productId, connectionId))?.status).toBe(ListingStatus.DELISTED);
  });

  it('refuses a listing setup without the product handle in the address', async () => {
    const owner = await signUp(app, 'Google Setup');
    const connectionId = await connectGoogleMerchant(app, http, owner, WEB_APP_URL);

    const response = await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/google-merchant/listing-setup`)
      .set('Cookie', owner.cookie)
      .send({ country: 'DE', productUrlTemplate: 'https://acme.example/products' });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
