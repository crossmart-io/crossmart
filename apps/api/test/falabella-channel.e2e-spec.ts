import { readFileSync } from 'node:fs';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  FakeHttpTransport,
  HttpMethod,
  type HttpResponse,
  HttpTransport,
} from '@crossmart/connectors';
import { ListingSyncRunner, SyncJobQueue } from '@crossmart/core';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

vi.hoisted(() => {
  Object.assign(process.env, {
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const FIXTURES = new URL('../../../libs/connectors/src/falabella/__fixtures__/', import.meta.url);
const API_KEY = 'e2e-falabella-api-key-0123456789';
const CREDENTIALS = {
  sellerId: 'SC478FA',
  userId: 'seller@example.com',
  apiKey: API_KEY,
  country: 'facl',
};

function xmlFixture(name: string, status = 200): HttpResponse {
  return { status, headers: {}, body: readFileSync(new URL(name, FIXTURES), 'utf8') };
}

function action(name: string): RegExp {
  return new RegExp(`^https://sellercenter-api\\.falabella\\.com/\\?Action=${name}&`);
}

describe('Falabella (e2e)', () => {
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
  const connect = (user: SignedUpUser, credentials: Record<string, string> = CREDENTIALS) =>
    request(server())
      .post(`${base(user)}/channel-connections/credentials`)
      .set('Cookie', user.cookie)
      .send({ channel: 'falabella', credentials });

  it('connects with pasted credentials, keeps the key secret, and replaces it on reconnect', async () => {
    const owner = await signUp(app, 'Falabella Seller');
    http
      .expect(HttpMethod.Get, action('FeedCount'), xmlFixture('feed-count.xml'))
      .expect(HttpMethod.Get, action('FeedCount'), xmlFixture('feed-count.xml'));

    const connected = await connect(owner).expect(HttpStatus.CREATED);
    const again = await connect(owner).expect(HttpStatus.CREATED);

    expect(connected.body).toMatchObject({
      reconnected: false,
      connection: {
        channel: 'falabella',
        externalAccountId: 'SC478FA:facl',
        displayName: 'SC478FA (Chile)',
        status: 'CONNECTED',
        falabella: {
          country: 'facl',
          sellerId: 'SC478FA',
          userId: 'seller@example.com',
          currencyCode: 'CLP',
        },
        etsy: null,
      },
    });
    expect(again.body).toMatchObject({ reconnected: true });
    const list = await request(server())
      .get(`${base(owner)}/channel-connections`)
      .set('Cookie', owner.cookie)
      .expect(HttpStatus.OK);
    expect(JSON.stringify([connected.body, again.body, list.body])).not.toContain(API_KEY);
    http.assertDone();
  });

  it('answers 422 when Falabella rejects the key, and 400 for missing fields', async () => {
    const owner = await signUp(app, 'Falabella Rejected');
    http.expect(HttpMethod.Get, action('FeedCount'), xmlFixture('error-login.xml', 400));

    const rejected = await connect(owner).expect(HttpStatus.UNPROCESSABLE_ENTITY);
    const incomplete = await connect(owner, { sellerId: 'SC478FA', country: 'famx' }).expect(
      HttpStatus.BAD_REQUEST,
    );

    expect(rejected.body).toMatchObject({
      failure: 'credentials_rejected',
      message: expect.stringContaining('E007: Login failed'),
    });
    expect(JSON.stringify(rejected.body)).not.toContain(API_KEY);
    expect(incomplete.body.message).toContain('apiKey is required');
    await request(server())
      .post(`${base(owner)}/channel-connections/credentials`)
      .set('Cookie', owner.cookie)
      .send({ channel: 'shopify', credentials: CREDENTIALS })
      .expect(HttpStatus.BAD_REQUEST);
    http.assertDone();
  });

  it('holds a listing back until the category’s required attributes are set', async () => {
    const owner = await signUp(app, 'Falabella Publisher');
    http.expect(HttpMethod.Get, action('FeedCount'), xmlFixture('feed-count.xml'));
    const connected = await connect(owner).expect(HttpStatus.CREATED);
    const connectionId = (connected.body as { connection: { id: string } }).connection.id;
    const product = await request(server())
      .post(`${base(owner)}/products`)
      .set('Cookie', owner.cookie)
      .send({
        title: 'Square mirror',
        handle: 'square-mirror',
        descriptionHtml: '<p>A square wall mirror.</p>',
        status: ProductStatus.ACTIVE,
        media: [{ url: 'https://cdn.example.com/mirror.jpg' }],
        variants: [{ sku: 'MIRROR-1', price: '19990', quantity: 3 }],
      })
      .expect(HttpStatus.CREATED);
    const productId = (product.body as { id: string }).id;
    http
      .expect(HttpMethod.Get, action('GetCategoryTree'), xmlFixture('category-tree.xml'))
      .expect(
        HttpMethod.Get,
        action('GetCategorySuggestion'),
        xmlFixture('category-suggestion.xml'),
      )
      .expect(
        HttpMethod.Get,
        action('GetCategoryAttributes'),
        xmlFixture('category-attributes.xml'),
      );

    await request(server())
      .post(`${base(owner)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', owner.cookie);
    for (const job of queue.drain()) {
      await runner.run(job);
    }

    const channels = await request(server())
      .get(`${base(owner)}/products/${productId}/channels`)
      .set('Cookie', owner.cookie)
      .expect(HttpStatus.OK);
    const listing = (
      channels.body as {
        connection: { id: string };
        listing: { status: ListingStatus; lastError: string };
      }[]
    ).find((entry) => entry.connection.id === connectionId)?.listing;
    expect(listing).toMatchObject({
      status: ListingStatus.ERROR,
      lastError: expect.stringContaining('Package height (cm)'),
    });
    expect(http.requests.some((sent) => sent.method === HttpMethod.Post)).toBe(false);
    http.assertDone();
  });
});
