import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import { FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import {
  AiProvider,
  ContentField,
  ContentGenerationQueue,
  EntitlementEnforcement,
  EntitlementErrorCode,
  Feature,
  SyncJobQueue,
} from '@crossmart/core';
import { FakeAiProvider } from '@crossmart/core/ai/testing/fake-ai.provider.js';
import { PrismaService, ProductStatus, WorkspaceRole } from '@crossmart/database';
import { AI_RATE_LIMITED_MESSAGE, CONTENT_DRAFTS_PER_WINDOW } from '../src/ai/ai.constants.js';
import { RecordingContentGenerationQueue } from './support/recording-content-generation.queue.js';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import { connectShopifyStore } from './support/shopify-store.js';
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

const DRAFT = { title: 'Stoneware Mug', descriptionHtml: '<p>Hand-glazed.</p>' };

describe('AI credits and rate limits (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const http = new FakeHttpTransport();
  const ai = new FakeAiProvider();
  const contentJobs = new RecordingContentGenerationQueue();
  /** Toggled per test, as `ENTITLEMENTS_ENFORCED` would be per deployment. */
  const enforcement = { enforced: false };

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(SyncJobQueue)
        .useValue(new RecordingSyncJobQueue())
        .overrideProvider(AiProvider)
        .useValue(ai)
        .overrideProvider(ContentGenerationQueue)
        .useValue(contentJobs)
        .overrideProvider(EntitlementEnforcement)
        .useValue(enforcement),
    );
    prisma = app.get(PrismaService);
    ai.answerWith(DRAFT);
  });

  afterEach(() => {
    enforcement.enforced = false;
    contentJobs.drain();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const base = (user: SignedUpUser) => `/api/v1/workspaces/${user.workspaceId}`;

  async function createProduct(user: SignedUpUser): Promise<string> {
    const response = await request(server())
      .post(`${base(user)}/products`)
      .set('Cookie', user.cookie)
      .send({
        title: `Mug ${randomUUID().slice(0, 8)}`,
        descriptionHtml: '<p>A mug.</p>',
        status: ProductStatus.ACTIVE,
        variants: [{ sku: `MUG-${randomUUID()}`, price: '20.00', quantity: 5 }],
      });
    expect(response.status).toBe(HttpStatus.CREATED);
    return response.body.id;
  }

  function draft(user: SignedUpUser, productId: string, apiKey?: string) {
    const call = request(server()).post(`${base(user)}/ai/content-drafts`);
    return (apiKey ? call.set(API_KEY_HEADER, apiKey) : call.set('Cookie', user.cookie)).send({
      productId,
      fields: [ContentField.Title],
    });
  }

  async function organizationOf(user: SignedUpUser): Promise<string> {
    const me = await request(server()).get('/api/v1/me').set('Cookie', user.cookie);
    return me.body.workspaces[0].organizationId;
  }

  /** Puts the user's organization on a plan of the test's own with `aiCredits` a month. */
  async function limitAiCredits(user: SignedUpUser, aiCredits: number): Promise<void> {
    const organizationId = await organizationOf(user);
    const unlimited = [
      Feature.ActiveListings,
      Feature.ChannelConnections,
      Feature.Workspaces,
      Feature.Members,
      Feature.ApiKeys,
    ].map((feature) => ({ feature, limit: null }));
    const plan = await prisma.plan.create({
      data: {
        code: `e2e-${randomUUID()}`,
        name: 'Tiny',
        active: false,
        sortOrder: 1_000,
        versions: {
          create: {
            version: 1,
            features: { create: [...unlimited, { feature: Feature.AiCredits, limit: aiCredits }] },
          },
        },
      },
      include: { versions: true },
    });
    await prisma.organizationSubscription.update({
      where: { organizationId },
      data: { planVersionId: plan.versions[0].id },
    });
  }

  function expectNoAiCredits(response: request.Response): void {
    expect(response.status).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(response.body).toMatchObject({
      code: EntitlementErrorCode.PlanLimitReached,
      feature: Feature.AiCredits,
    });
  }

  it('answers 429 past the drafts rate limit, per caller in the workspace', async () => {
    const owner = await signUp(app, 'Busy Writer');
    const productId = await createProduct(owner);
    const key = await request(server())
      .post(`${base(owner)}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Script', role: WorkspaceRole.EDITOR });

    for (let call = 0; call < CONTENT_DRAFTS_PER_WINDOW; call += 1) {
      expect((await draft(owner, productId)).status).toBe(HttpStatus.OK);
    }
    const limited = await draft(owner, productId);

    expect(limited.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(limited.body.message).toBe(AI_RATE_LIMITED_MESSAGE);
    expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
    expect((await draft(owner, productId, key.body.secret)).status).toBe(HttpStatus.OK);
  });

  it('does not rate limit the other workspace routes', async () => {
    const owner = await signUp(app, 'Reader');

    const status = await request(server())
      .get(`${base(owner)}/ai/status`)
      .set('Cookie', owner.cookie);

    expect(status.status).toBe(HttpStatus.OK);
    expect(status.headers).not.toHaveProperty('x-ratelimit-limit');
  });

  it('meters one credit per AI call and answers 402 once they run out', async () => {
    const owner = await signUp(app, 'Out Of Credits');
    const productId = await createProduct(owner);
    await limitAiCredits(owner, 1);
    enforcement.enforced = true;
    const calls = ai.requests.length;

    expect((await draft(owner, productId)).status).toBe(HttpStatus.OK);
    expectNoAiCredits(await draft(owner, productId));

    expect(ai.requests.length).toBe(calls + 1);
    const subscription = await request(server())
      .get(`/api/v1/organizations/${await organizationOf(owner)}/subscription`)
      .set('Cookie', owner.cookie);
    expect(
      (subscription.body.features as { feature: Feature; usage: number }[]).find(
        (entry) => entry.feature === Feature.AiCredits,
      ),
    ).toMatchObject({ limit: 1, usage: 1 });
  });

  it('refuses a generation the credits do not cover, before queueing anything', async () => {
    const owner = await signUp(app, 'Big Batch');
    const connectionId = await connectShopifyStore(app, http, owner);
    const productIds = [await createProduct(owner), await createProduct(owner)];
    await limitAiCredits(owner, 1);
    enforcement.enforced = true;

    const response = await request(server())
      .post(`${base(owner)}/ai/content-generations`)
      .set('Cookie', owner.cookie)
      .send({ connectionId, productIds });

    expectNoAiCredits(response);
    expect(contentJobs.drain()).toEqual([]);
  });

  it('only reports spent credits while plans are not enforced', async () => {
    const owner = await signUp(app, 'Unenforced');
    const productId = await createProduct(owner);
    await limitAiCredits(owner, 0);

    expect((await draft(owner, productId)).status).toBe(HttpStatus.OK);
  });
});
