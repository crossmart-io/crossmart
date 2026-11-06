import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import {
  FakeHttpTransport,
  FakeImageFetcher,
  HttpMethod,
  HttpTransport,
  ImageFetcher,
  jsonResponse,
} from '@crossmart/connectors';
import { ListingSyncRunner, SyncJobQueue } from '@crossmart/core';
import { ListingStatus, ProductStatus } from '@crossmart/database';
import { connectEtsy, ETSY_API, ETSY_SHOP_API } from './support/etsy-shop.js';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

const WEB_APP_URL = 'http://localhost:5184';

// Fake Etsy app settings, set before the app module reads them.
vi.hoisted(() => {
  Object.assign(process.env, {
    ETSY_API_KEY: 'e2ekeystring',
    ETSY_SHARED_SECRET: 'e2e-shared-secret',
    API_PUBLIC_URL: 'http://localhost:3011',
    WEB_APP_URL: 'http://localhost:5184',
    CREDENTIALS_MASTER_KEY: Buffer.from(Array.from({ length: 32 }, (_, index) => index)).toString(
      'base64',
    ),
  });
});

const LISTING_ID = 1801234567;
const LISTING_API = `${ETSY_API}/application/listings/${LISTING_ID}`;
const SHOP_LISTING_API = `${ETSY_SHOP_API}/listings/${LISTING_ID}`;
const listingResponse = (state: string) =>
  jsonResponse({
    listing_id: LISTING_ID,
    state,
    url: `https://www.etsy.com/listing/${LISTING_ID}/mug`,
  });

/** The inventory Etsy holds for a one-variant listing. */
const listedInventory = (sku: string, quantity: number) =>
  jsonResponse({
    products: [
      {
        sku,
        offerings: [
          {
            quantity,
            is_enabled: true,
            price: { amount: 2800, divisor: 100, currency_code: 'USD' },
            readiness_state_id: 18201076875,
          },
        ],
        property_values: [],
      },
    ],
    price_on_property: [],
    quantity_on_property: [],
    sku_on_property: [],
  });

interface ProductChannelBody {
  connection: { id: string };
  listing: { status: ListingStatus; externalId: string | null; lastError: string | null } | null;
}

describe('Etsy (e2e)', () => {
  let app: INestApplication<App>;
  const http = new FakeHttpTransport();
  const images = new FakeImageFetcher();
  const queue = new RecordingSyncJobQueue();
  let runner: ListingSyncRunner;

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(ImageFetcher)
        .useValue(images)
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

  async function createMug(user: SignedUpUser, sku: string): Promise<string> {
    const created = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: 'Speckled stoneware mug',
        handle: 'speckled-mug',
        descriptionHtml: '<p>Wheel-thrown <em>stoneware</em>.</p>',
        status: ProductStatus.ACTIVE,
        tags: ['stoneware mug', 'handmade'],
        media: [{ url: 'https://cdn.example.com/mug.jpg' }],
        variants: [{ sku, price: '28.00', quantity: 4 }],
      });
    return (created.body as { id: string }).id;
  }

  it('connects a shop with PKCE, needs its listing setup, then publishes a listing', async () => {
    const owner = await signUp(app, 'Etsy Shop');
    const connectionId = await connectEtsy(app, http, owner, WEB_APP_URL);

    const connection = await request(server())
      .get(`${base(owner)}/channel-connections/${connectionId}`)
      .set('Cookie', owner.cookie);
    expect(connection.body).toMatchObject({
      channel: 'etsy',
      externalAccountId: '87654321',
      displayName: 'ClayAndKiln',
      etsy: {
        shopName: 'ClayAndKiln',
        currencyCode: 'USD',
        listingSetup: null,
        readyToList: false,
      },
      publishReadiness: {
        ready: false,
        missing: ['item_details', 'shipping_profile', 'processing_profile'],
      },
    });
    expect(JSON.stringify(connection.body)).not.toContain('e2e_owner_login');

    const setup = await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/etsy/listing-setup`)
      .set('Cookie', owner.cookie)
      .send({
        whoMade: 'i_did',
        whenMade: 'made_to_order',
        isSupply: false,
        shippingProfileId: '6722757781',
        processingProfileId: '18201076875',
      });
    expect(setup.status).toBe(HttpStatus.OK);
    expect(setup.body).toMatchObject({
      etsy: { readyToList: true },
      publishReadiness: { ready: true, missing: [] },
    });

    const sku = `MUG-${Date.now()}`;
    const productId = await createMug(owner, sku);
    http
      .expect(
        HttpMethod.Get,
        `${ETSY_API}/application/seller-taxonomy/nodes`,
        jsonResponse({ results: [{ id: 1076, name: 'Mugs', children: [] }] }),
      )
      .expect(HttpMethod.Post, `${ETSY_SHOP_API}/listings`, listingResponse('draft'))
      .expect(HttpMethod.Get, `${LISTING_API}/images`, jsonResponse({ results: [] }))
      .expect(HttpMethod.Post, `${SHOP_LISTING_API}/images`, jsonResponse({ listing_image_id: 1 }))
      .expect(HttpMethod.Put, `${LISTING_API}/inventory`, jsonResponse({ products: [] }))
      .expect(HttpMethod.Patch, SHOP_LISTING_API, listingResponse('active'))
      // The stock sync after publishing finds Etsy showing the quantity already: no write.
      .expect(HttpMethod.Get, `${LISTING_API}/inventory`, listedInventory(sku, 4));
    await request(server())
      .post(`${base(owner)}/products/${productId}/channels/${connectionId}`)
      .set('Cookie', owner.cookie);
    await runQueued();
    http.assertDone();

    const channels = await request(server())
      .get(`${base(owner)}/products/${productId}/channels`)
      .set('Cookie', owner.cookie);
    const view = (channels.body as ProductChannelBody[]).find(
      (candidate) => candidate.connection.id === connectionId,
    );
    expect(view?.listing).toMatchObject({
      status: ListingStatus.ACTIVE,
      externalId: String(LISTING_ID),
      lastError: null,
    });
    expect(images.fetched).toEqual(['https://cdn.example.com/mug.jpg']);
    const draft = http.requests.find(
      ({ method, url }) => method === HttpMethod.Post && url === `${ETSY_SHOP_API}/listings`,
    );
    const draftForm = Object.fromEntries(new URLSearchParams(draft?.body));
    expect(draftForm).toMatchObject({
      title: 'Speckled stoneware mug',
      description: 'Wheel-thrown stoneware.',
      taxonomy_id: '1076',
      shipping_profile_id: '6722757781',
      readiness_state_id: '18201076875',
      who_made: 'i_did',
      when_made: 'made_to_order',
    });
    expect(draft?.headers?.['x-api-key']).toBe('e2ekeystring:e2e-shared-secret');
  });

  it('refuses profiles the shop does not have', async () => {
    const owner = await signUp(app, 'Etsy Profiles');
    const connectionId = await connectEtsy(app, http, owner, WEB_APP_URL);

    const response = await request(server())
      .put(`${base(owner)}/channel-connections/${connectionId}/etsy/listing-setup`)
      .set('Cookie', owner.cookie)
      .send({
        whoMade: 'i_did',
        whenMade: 'made_to_order',
        isSupply: false,
        shippingProfileId: '1',
        processingProfileId: null,
      });

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
