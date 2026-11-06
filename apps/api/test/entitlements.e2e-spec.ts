import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { ChannelType, FakeHttpTransport, HttpTransport } from '@crossmart/connectors';
import {
  ConnectFailure,
  EntitlementEnforcement,
  EntitlementErrorCode,
  Feature,
  FeatureKind,
  ListingSyncRunner,
  SyncJobKind,
  SyncJobQueue,
} from '@crossmart/core';
import {
  ListingStatus,
  PrismaService,
  ProductStatus,
  SubscriptionStatus,
  WorkspaceRole,
} from '@crossmart/database';
import { RecordingSyncJobQueue } from './support/recording-sync-job.queue.js';
import {
  connectShopifyStore,
  DEFAULT_GRANTED_SCOPES,
  expectTokenExchange,
  newShop,
  signQuery,
} from './support/shopify-store.js';
import { browserCookies, createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

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

/** Limits of a test plan; features left out are not included. */
type Limits = Partial<Record<Feature, number | null>>;

/** Room for everything, so a test narrows only the feature it is about. */
const ROOMY: Limits = {
  [Feature.ActiveListings]: null,
  [Feature.ChannelConnections]: null,
  [Feature.Workspaces]: null,
  [Feature.Members]: null,
  [Feature.ApiKeys]: null,
};

describe('Plans and entitlements (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let runner: ListingSyncRunner;
  const http = new FakeHttpTransport();
  const queue = new RecordingSyncJobQueue();
  /** Toggled per test, as `ENTITLEMENTS_ENFORCED` would be per deployment. */
  const enforcement = { enforced: false };

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(HttpTransport)
        .useValue(http)
        .overrideProvider(SyncJobQueue)
        .useValue(queue)
        .overrideProvider(EntitlementEnforcement)
        .useValue(enforcement),
    );
    prisma = app.get(PrismaService);
    runner = app.get(ListingSyncRunner);
  });

  afterEach(() => {
    enforcement.enforced = false;
    queue.drain();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();
  const base = (user: SignedUpUser) => `/api/v1/workspaces/${user.workspaceId}`;

  async function organizationOf(user: SignedUpUser): Promise<string> {
    const me = await request(server()).get('/api/v1/me').set('Cookie', user.cookie);
    return me.body.workspaces[0].organizationId;
  }

  async function subscriptionOf(user: SignedUpUser) {
    return request(server())
      .get(`/api/v1/organizations/${await organizationOf(user)}/subscription`)
      .set('Cookie', user.cookie);
  }

  /** A plan of the test's own, version 1 with `limits`, so seeded plans are never touched. */
  async function createPlan(limits: Limits): Promise<{ planId: string; versionId: string }> {
    const plan = await prisma.plan.create({
      data: {
        code: `e2e-${randomUUID()}`,
        name: 'Tiny',
        active: false,
        sortOrder: 1_000,
        versions: { create: { version: 1, features: { create: featureRows(limits) } } },
      },
      include: { versions: true },
    });
    return { planId: plan.id, versionId: plan.versions[0].id };
  }

  function featureRows(limits: Limits) {
    return Object.entries(limits).map(([feature, limit]) => ({ feature, limit }));
  }

  async function putOnPlan(user: SignedUpUser, limits: Limits): Promise<string> {
    const { planId, versionId } = await createPlan({ ...ROOMY, ...limits });
    await prisma.organizationSubscription.update({
      where: { organizationId: await organizationOf(user) },
      data: { planVersionId: versionId },
    });
    return planId;
  }

  function expectPlanLimit(response: request.Response, feature: Feature): void {
    expect(response.status).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(response.body).toMatchObject({
      statusCode: HttpStatus.PAYMENT_REQUIRED,
      code: EntitlementErrorCode.PlanLimitReached,
      feature,
      plan: expect.stringMatching(/^e2e-/),
    });
    expect(response.body.message).toMatch(/^The Tiny plan includes .* Upgrade the plan/);
  }

  async function createWorkspace(user: SignedUpUser, name: string) {
    return request(server())
      .post(`/api/v1/organizations/${await organizationOf(user)}/workspaces`)
      .set('Cookie', user.cookie)
      .send({ name });
  }

  describe('the seeded plan lineup (ADR 0020)', () => {
    /** What an offered plan's latest version allows; null is unlimited. */
    const allows = (
      activeListings: number,
      stores: number | null,
      workspaces: number | null,
      members: number | null,
    ): Limits => ({
      [Feature.ActiveListings]: activeListings,
      [Feature.ChannelConnections]: stores,
      [Feature.Workspaces]: workspaces,
      [Feature.Members]: members,
    });
    const LINEUP: Record<string, Limits> = {
      starter: { ...allows(1_000, 3, 1, 2), [Feature.AiCredits]: 300 },
      pro: { ...allows(3_000, 5, 1, 5), [Feature.AiCredits]: 1_500 },
      growth: { ...allows(10_000, 10, 2, 10), [Feature.AiCredits]: 5_000 },
      scale: { ...allows(50_000, null, 5, 25), [Feature.AiCredits]: 20_000 },
      enterprise: allows(100_000, null, null, null),
    };
    const LEGACY_PLANS = ['free', 'agency'];

    const latestVersions = () =>
      prisma.plan.findMany({
        where: { code: { in: [...Object.keys(LINEUP), ...LEGACY_PLANS] } },
        orderBy: { sortOrder: 'asc' },
        include: {
          versions: { orderBy: { version: 'desc' }, take: 1, include: { features: true } },
        },
      });

    it('offers the lineup in order, starts new organizations on Starter and keeps legacy plans', async () => {
      const plans = await latestVersions();

      expect(plans.filter((plan) => plan.active).map((plan) => plan.code)).toEqual(
        Object.keys(LINEUP),
      );
      expect(plans.filter((plan) => plan.isDefault).map((plan) => plan.code)).toEqual(['starter']);
      expect(plans.filter((plan) => !plan.active).map((plan) => plan.code)).toEqual(LEGACY_PLANS);
    });

    it('grants every feature in every offered plan, with the published limits', async () => {
      for (const plan of (await latestVersions()).filter((entry) => entry.active)) {
        const features = new Map(plan.versions[0].features.map((row) => [row.feature, row]));

        expect(new Set(features.keys())).toEqual(new Set(Object.values(Feature)));
        expect(features.get(Feature.AutonomousAgents)?.enabled).toBe(true);
        for (const [feature, limit] of Object.entries(LINEUP[plan.code])) {
          expect({ plan: plan.code, feature, limit: features.get(feature)?.limit }).toEqual({
            plan: plan.code,
            feature,
            limit,
          });
        }
      }
    });
  });

  describe('GET /organizations/:id/subscription', () => {
    it('puts every new organization on the starter plan and reports its usage', async () => {
      const owner = await signUp(app, 'Plan Owner');

      const response = await subscriptionOf(owner);

      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toMatchObject({
        plan: { code: 'starter', name: 'Starter', version: 2, offered: true },
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: null,
        enforced: false,
      });
      const features = new Map(
        (response.body.features as { feature: Feature }[]).map((entry) => [entry.feature, entry]),
      );
      expect([...features.keys()]).toEqual(Object.values(Feature));
      expect(features.get(Feature.ActiveListings)).toEqual({
        feature: Feature.ActiveListings,
        kind: FeatureKind.Limit,
        enabled: true,
        limit: 1_000,
        usage: 0,
      });
      expect(features.get(Feature.Workspaces)).toMatchObject({ limit: 1, usage: 1 });
      expect(features.get(Feature.Members)).toMatchObject({ usage: 1 });
      expect(features.get(Feature.AiCredits)).toMatchObject({ usage: 0 });
      expect(features.get(Feature.AutonomousAgents)).toMatchObject({
        kind: FeatureKind.Flag,
        enabled: true,
        usage: null,
      });
    });

    it('is for owners and admins: other members get 403, outsiders 404', async () => {
      const owner = await signUp(app, 'Owner');
      const admin = await signUp(app, 'Admin');
      const editor = await signUp(app, 'Editor');
      const stranger = await signUp(app, 'Stranger');
      await prisma.workspaceMember.createMany({
        data: [
          {
            workspaceId: owner.workspaceId,
            userId: await userIdOf(admin),
            role: WorkspaceRole.ADMIN,
          },
          {
            workspaceId: owner.workspaceId,
            userId: await userIdOf(editor),
            role: WorkspaceRole.EDITOR,
          },
        ],
      });
      const path = `/api/v1/organizations/${await organizationOf(owner)}/subscription`;
      const statusFor = async (user: SignedUpUser) =>
        (await request(server()).get(path).set('Cookie', user.cookie)).status;

      expect(await statusFor(admin)).toBe(HttpStatus.OK);
      expect(await statusFor(editor)).toBe(HttpStatus.FORBIDDEN);
      expect(await statusFor(stranger)).toBe(HttpStatus.NOT_FOUND);
    });

    it('keeps an organization on its plan version when the plan changes (grandfathering)', async () => {
      const owner = await signUp(app, 'Early Bird');
      const planId = await putOnPlan(owner, { [Feature.ActiveListings]: 100 });
      await prisma.planVersion.create({
        data: {
          planId,
          version: 2,
          features: { create: featureRows({ ...ROOMY, [Feature.ActiveListings]: 10 }) },
        },
      });

      const response = await subscriptionOf(owner);

      expect(response.body.plan.version).toBe(1);
      expect(
        (response.body.features as { feature: Feature; limit: number }[]).find(
          (entry) => entry.feature === Feature.ActiveListings,
        )?.limit,
      ).toBe(100);
    });
  });

  async function userIdOf(user: SignedUpUser): Promise<string> {
    const record = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });
    return record.id;
  }

  describe('workspaces', () => {
    it('reports going past the limit while not enforced', async () => {
      const owner = await signUp(app, 'Unenforced Agency');
      await putOnPlan(owner, { [Feature.Workspaces]: 1 });

      const created = await createWorkspace(owner, 'Second brand');
      const subscription = await subscriptionOf(owner);

      expect(created.status).toBe(HttpStatus.CREATED);
      expect(
        (subscription.body.features as { feature: Feature; usage: number }[]).find(
          (entry) => entry.feature === Feature.Workspaces,
        )?.usage,
      ).toBe(2);
    });

    it('refuses a workspace past the limit with 402 when enforced, and creates nothing', async () => {
      const owner = await signUp(app, 'Enforced Agency');
      await putOnPlan(owner, { [Feature.Workspaces]: 2 });
      enforcement.enforced = true;

      const second = await createWorkspace(owner, 'Second brand');
      const third = await createWorkspace(owner, 'Third brand');

      expect(second.status).toBe(HttpStatus.CREATED);
      expectPlanLimit(third, Feature.Workspaces);
      expect(
        await prisma.workspace.count({ where: { organizationId: await organizationOf(owner) } }),
      ).toBe(2);
    });
  });

  describe('API keys and members', () => {
    const createKey = (user: SignedUpUser) =>
      request(server())
        .post(`${base(user)}/api-keys`)
        .set('Cookie', user.cookie)
        .send({ name: 'Agent', role: WorkspaceRole.EDITOR });
    const invite = (user: SignedUpUser) =>
      request(server())
        .post(`${base(user)}/invitations`)
        .set('Cookie', user.cookie)
        .send({ email: `${randomUUID()}@example.com`, role: WorkspaceRole.VIEWER });

    it('creates keys and invites past the limits while not enforced', async () => {
      const owner = await signUp(app, 'Open Team');
      await putOnPlan(owner, { [Feature.ApiKeys]: 0, [Feature.Members]: 1 });

      expect((await createKey(owner)).status).toBe(HttpStatus.CREATED);
      expect((await invite(owner)).status).toBe(HttpStatus.CREATED);
    });

    it('refuses the key and the seat past the limits when enforced', async () => {
      const owner = await signUp(app, 'Full Team');
      await putOnPlan(owner, { [Feature.ApiKeys]: 1, [Feature.Members]: 1 });
      enforcement.enforced = true;

      expect((await createKey(owner)).status).toBe(HttpStatus.CREATED);
      expectPlanLimit(await createKey(owner), Feature.ApiKeys);
      expectPlanLimit(await invite(owner), Feature.Members);
      expect(
        await prisma.workspaceInvitation.count({ where: { workspaceId: owner.workspaceId } }),
      ).toBe(0);
    });
  });

  describe('channel connections', () => {
    const startConnecting = (user: SignedUpUser, shop: string) =>
      request(server())
        .post(`${base(user)}/channel-connections/authorizations`)
        .set('Cookie', user.cookie)
        .send({ channel: ChannelType.Shopify, accountHandle: shop });

    it('refuses a new store when enforced, but lets a connected one reconnect', async () => {
      const owner = await signUp(app, 'One Store');
      await putOnPlan(owner, { [Feature.ChannelConnections]: 1 });
      const shop = newShop();
      await connectShopifyStore(app, http, owner, shop);
      enforcement.enforced = true;

      expectPlanLimit(await startConnecting(owner, newShop()), Feature.ChannelConnections);
      expect((await startConnecting(owner, shop)).status).toBe(HttpStatus.CREATED);
    });

    it('starts connecting past the limit while not enforced', async () => {
      const owner = await signUp(app, 'Many Stores');
      await putOnPlan(owner, { [Feature.ChannelConnections]: 0 });

      expect((await startConnecting(owner, newShop())).status).toBe(HttpStatus.CREATED);
    });

    it('stores nothing when the plan filled up before the store approved', async () => {
      const owner = await signUp(app, 'Race');
      await putOnPlan(owner, { [Feature.ChannelConnections]: 0 });
      const shop = newShop();
      const started = await startConnecting(owner, shop);
      const state = new URL(started.body.authorizationUrl).searchParams.get('state') ?? '';
      expectTokenExchange(http, shop, DEFAULT_GRANTED_SCOPES);
      enforcement.enforced = true;

      const callback = await request(server())
        .get('/api/v1/channels/shopify/oauth/callback')
        .query(signQuery({ code: 'code', shop, state, timestamp: '1762164000' }))
        .set('Cookie', browserCookies(owner, started));

      expect(callback.status).toBe(HttpStatus.FOUND);
      expect(new URL(callback.headers.location).searchParams.get('error')).toBe(
        ConnectFailure.PlanLimitReached,
      );
      expect(
        await prisma.channelConnection.count({ where: { workspaceId: owner.workspaceId } }),
      ).toBe(0);
    });
  });

  describe('active listings', () => {
    async function createProduct(user: SignedUpUser, title: string): Promise<string> {
      const response = await request(server())
        .post(`${base(user)}/products`)
        .set('Cookie', user.cookie)
        .send({
          title,
          status: ProductStatus.ACTIVE,
          variants: [{ sku: `${randomUUID()}`, price: '10.00', quantity: 5 }],
        });
      expect(response.status).toBe(HttpStatus.CREATED);
      return response.body.id as string;
    }

    async function storeWithProducts(name: string, limit: number) {
      const owner = await signUp(app, name);
      await putOnPlan(owner, { [Feature.ActiveListings]: limit });
      const connectionId = await connectShopifyStore(app, http, owner);
      const productIds = [await createProduct(owner, 'Mug'), await createProduct(owner, 'Bowl')];
      const path = (suffix: string) =>
        `${base(owner)}/channel-connections/${connectionId}/${suffix}`;
      return { owner, connectionId, productIds, path };
    }

    const EVERYTHING = { filter: {}, includeProductIds: [], excludeProductIds: [] };
    const listingCount = (connectionId: string) =>
      prisma.listing.count({ where: { connectionId } });

    it('refuses a rule, a publish or added products that do not fit, changing nothing', async () => {
      const { owner, connectionId, productIds, path } = await storeWithProducts('Full Shop', 1);
      enforcement.enforced = true;

      const selection = await request(server())
        .put(path('product-selection'))
        .set('Cookie', owner.cookie)
        .send({ rule: EVERYTHING });
      const added = await request(server())
        .post(path('products/add'))
        .set('Cookie', owner.cookie)
        .send({ productIds });

      expectPlanLimit(selection, Feature.ActiveListings);
      expect(selection.body).toMatchObject({ usage: 0, requested: 2, limit: 1 });
      expectPlanLimit(added, Feature.ActiveListings);
      const connection = await prisma.channelConnection.findUniqueOrThrow({
        where: { id: connectionId },
      });
      expect((connection.settings as { productSelection?: unknown }).productSelection ?? null).toBe(
        null,
      );
      expect(await listingCount(connectionId)).toBe(0);
      expect(queue.drain()).toEqual([]);

      enforcement.enforced = false;
      await request(server())
        .put(path('product-selection'))
        .set('Cookie', owner.cookie)
        .send({ rule: EVERYTHING });
      await prisma.listing.deleteMany({ where: { connectionId } });
      queue.drain();
      enforcement.enforced = true;

      expectPlanLimit(
        await request(server()).post(path('sync')).set('Cookie', owner.cookie),
        Feature.ActiveListings,
      );
      expect(await listingCount(connectionId)).toBe(0);
    });

    it('queues everything while not enforced', async () => {
      const { owner, connectionId, path } = await storeWithProducts('Open Shop', 1);

      const selection = await request(server())
        .put(path('product-selection'))
        .set('Cookie', owner.cookie)
        .send({ rule: EVERYTHING });

      expect(selection.status).toBe(HttpStatus.OK);
      expect(await listingCount(connectionId)).toBe(2);
    });

    it('blocks a queued publish in the worker once the plan is full, sending nothing', async () => {
      const { owner, connectionId, productIds, path } = await storeWithProducts('Busy Shop', 1);
      await request(server())
        .put(path('product-selection'))
        .set('Cookie', owner.cookie)
        .send({ rule: EVERYTHING });
      const [live, waiting] = productIds;
      await prisma.listing.updateMany({
        where: { connectionId, productId: live },
        data: { status: ListingStatus.ACTIVE, externalId: `gid://shopify/Product/${randomUUID()}` },
      });
      enforcement.enforced = true;

      const job = queue
        .drain()
        .find((queued) => queued.kind === SyncJobKind.Content && queued.productId === waiting);
      if (!job) throw new Error('The selection did not queue the product');
      await runner.run(job);

      const blocked = await prisma.listing.findFirstOrThrow({
        where: { connectionId, productId: waiting },
      });
      expect(blocked.status).toBe(ListingStatus.ERROR);
      expect(blocked.externalId).toBeNull();
      expect(blocked.lastError).toMatch(
        /^The Tiny plan includes 1 active listing, and 1 is in use/,
      );
    });
  });
});
