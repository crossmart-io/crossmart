import { randomUUID } from 'node:crypto';
import { HttpStatus, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { API_KEY_HEADER } from '@crossmart/common';
import {
  BillingEventType,
  BillingProvider,
  EntitlementEnforcement,
  EntitlementErrorCode,
  SandboxRestriction,
  SubscriptionAccessState,
  type BillingWebhookEvent,
  type ProviderSubscription,
} from '@crossmart/core';
import {
  FAKE_CHECKOUT_URL,
  FAKE_PORTAL_URL,
  FAKE_WEBHOOK_SIGNATURE,
  FakeBillingProvider,
  fakePrice,
  fakeSubscription,
} from '@crossmart/core/billing/testing/fake-billing-provider.js';
import {
  BillingInterval,
  PrismaService,
  SubscriptionStatus,
  WorkspaceRole,
} from '@crossmart/database';
import { createTestApp, signUp, type SignedUpUser } from './support/test-app.js';

// Billing on, as on Crossmart Cloud; the provider itself is the fake, so nothing reaches Stripe.
vi.hoisted(() => {
  Object.assign(process.env, {
    BILLING_DRIVER: 'stripe',
    STRIPE_SECRET_KEY: 'sk_test_e2e_never_used',
    WEB_APP_URL: 'http://localhost:5179',
  });
});

const PLANS = '/api/v1/billing/plans';
const WEBHOOK = '/api/v1/billing/webhooks/stripe';
const SIGNATURE_HEADER = 'stripe-signature';

/** `ENTITLEMENTS_ENFORCED`, toggled per test, with billing on as on Cloud. */
class TestEnforcement {
  enforced = false;
  readonly billingEnabled = true;
  readonly subscriptionTerms = { pastDueGraceDays: 7, legacyAccessUntil: null };

  get subscriptionsEnforced(): boolean {
    return this.enforced;
  }
}

describe('Billing (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const provider = new FakeBillingProvider();
  const enforcement = new TestEnforcement();

  beforeAll(async () => {
    provider.prices.push(
      fakePrice('starter', BillingInterval.MONTHLY, 2900),
      fakePrice('starter', BillingInterval.ANNUAL, 27600),
      fakePrice('growth', BillingInterval.MONTHLY, 12900),
      fakePrice('growth', BillingInterval.ANNUAL, 123600),
    );
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(BillingProvider)
        .useValue(provider)
        .overrideProvider(EntitlementEnforcement)
        .useValue(enforcement),
    );
    prisma = app.get(PrismaService);
  });

  afterEach(() => {
    enforcement.enforced = false;
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function organizationOf(user: SignedUpUser): Promise<string> {
    const me = await request(server()).get('/api/v1/me').set('Cookie', user.cookie);
    return me.body.workspaces[0].organizationId;
  }

  async function billingOf(user: SignedUpUser) {
    return request(server())
      .get(`/api/v1/organizations/${await organizationOf(user)}/billing`)
      .set('Cookie', user.cookie);
  }

  async function startCheckout(user: SignedUpUser, planCode = 'starter') {
    return request(server())
      .post(`/api/v1/organizations/${await organizationOf(user)}/billing/checkout-sessions`)
      .set('Cookie', user.cookie)
      .send({ planCode, interval: BillingInterval.MONTHLY });
  }

  function createProduct(user: SignedUpUser) {
    return request(server())
      .post(`/api/v1/workspaces/${user.workspaceId}/products`)
      .set('Cookie', user.cookie)
      .send({ title: `Mug ${randomUUID()}`, variants: [{ price: '12' }] });
  }

  function deliver(event: Partial<BillingWebhookEvent>, signature = FAKE_WEBHOOK_SIGNATURE) {
    const body: BillingWebhookEvent = {
      id: `evt_${randomUUID()}`,
      providerType: 'customer.subscription.updated',
      type: BillingEventType.SubscriptionChanged,
      subscriptionId: null,
      customerId: null,
      organizationId: null,
      ...event,
    };
    return request(server())
      .post(WEBHOOK)
      .set(SIGNATURE_HEADER, signature)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));
  }

  /** The provider now holds `subscription`, and says so in a webhook. */
  async function providerHolds(subscription: ProviderSubscription, organizationId: string | null) {
    provider.subscriptions.set(subscription.id, subscription);
    const response = await deliver({
      type: BillingEventType.CheckoutCompleted,
      providerType: 'checkout.session.completed',
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      organizationId,
    });
    expect(response.status).toBe(HttpStatus.OK);
  }

  it('lists the plans with prices from the provider, and Enterprise through sales', async () => {
    const response = await request(server()).get(PLANS);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body.salesEmail).toBe('hello@crossmart.io');
    const byCode = new Map(
      response.body.plans.map((plan: { code: string }) => [plan.code, plan] as const),
    );
    expect(byCode.get('starter')).toMatchObject({
      selfServe: true,
      prices: [
        { interval: BillingInterval.MONTHLY, amount: 2900, monthlyAmount: 2900, currency: 'usd' },
        { interval: BillingInterval.ANNUAL, amount: 27600, monthlyAmount: 2300, currency: 'usd' },
      ],
    });
    expect(byCode.get('enterprise')).toMatchObject({ selfServe: false, prices: [] });
  });

  it('starts a new organization without a subscription, offering a trial', async () => {
    const owner = await signUp(app, 'Owner');

    const response = await billingOf(owner);

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body).toMatchObject({
      enabled: true,
      status: SubscriptionStatus.INCOMPLETE,
      plan: { code: 'starter' },
      trialAvailable: true,
      hasBillingAccount: false,
      access: {
        state: SubscriptionAccessState.SubscriptionRequired,
        writable: false,
        enforced: false,
      },
    });
  });

  it('keeps an organization without a subscription read-only, once enforced', async () => {
    const owner = await signUp(app, 'Owner');
    expect((await createProduct(owner)).status).toBe(HttpStatus.CREATED);

    enforcement.enforced = true;
    const refused = await createProduct(owner);

    expect(refused.status).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(refused.body).toMatchObject({
      code: EntitlementErrorCode.SubscriptionInactive,
      state: SubscriptionAccessState.SubscriptionRequired,
    });
    expect(refused.body.message).toContain('Ask an owner or admin of the organization');
    const reads = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set('Cookie', owner.cookie);
    expect(reads.status).toBe(HttpStatus.OK);
    const access = await request(server())
      .get(`/api/v1/workspaces/${owner.workspaceId}/billing-access`)
      .set('Cookie', owner.cookie);
    expect(access.body).toMatchObject({ writable: false, enforced: true });
  });

  it('refuses read-only writes to API keys too, but lets them revoke access', async () => {
    const owner = await signUp(app, 'Owner');
    const key = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/api-keys`)
      .set('Cookie', owner.cookie)
      .send({ name: 'Script', role: WorkspaceRole.EDITOR });
    enforcement.enforced = true;

    const write = await request(server())
      .post(`/api/v1/workspaces/${owner.workspaceId}/products`)
      .set(API_KEY_HEADER, key.body.secret)
      .send({ title: 'Mug', variants: [{ price: '12' }] });
    expect(write.status).toBe(HttpStatus.PAYMENT_REQUIRED);

    const revoke = await request(server())
      .delete(`/api/v1/workspaces/${owner.workspaceId}/api-keys/${key.body.apiKey.id}`)
      .set('Cookie', owner.cookie);
    expect(revoke.status).toBe(HttpStatus.NO_CONTENT);
  });

  it('keeps an organization from before billing writable (grandfathered)', async () => {
    const owner = await signUp(app, 'Owner');
    await prisma.organizationSubscription.update({
      where: { organizationId: await organizationOf(owner) },
      data: { status: SubscriptionStatus.ACTIVE },
    });
    enforcement.enforced = true;

    expect((await createProduct(owner)).status).toBe(HttpStatus.CREATED);
    expect((await billingOf(owner)).body.access).toMatchObject({
      state: SubscriptionAccessState.Legacy,
      writable: true,
      until: null,
    });
  });

  it('starts checkout with a trial for owners, and refuses members without billing:manage', async () => {
    const owner = await signUp(app, 'Owner');
    const organizationId = await organizationOf(owner);

    const response = await startCheckout(owner);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual({ url: FAKE_CHECKOUT_URL });
    expect(provider.checkouts.at(-1)).toMatchObject({
      organizationId,
      priceId: 'price_starter_monthly',
      trialDays: 7,
      customerId: `cus_${organizationId}`,
    });
    expect((await billingOf(owner)).body.hasBillingAccount).toBe(true);

    const editor = await signUp(app, 'Editor');
    await prisma.workspaceMember.create({
      data: {
        workspaceId: owner.workspaceId,
        userId: await userIdOf(editor),
        role: WorkspaceRole.EDITOR,
      },
    });
    const refused = await request(server())
      .post(`/api/v1/organizations/${organizationId}/billing/checkout-sessions`)
      .set('Cookie', editor.cookie)
      .send({ planCode: 'starter', interval: BillingInterval.MONTHLY });
    expect(refused.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('refuses plans that are not sold online', async () => {
    const owner = await signUp(app, 'Owner');

    expect((await startCheckout(owner, 'enterprise')).status).toBe(HttpStatus.BAD_REQUEST);
    expect((await startCheckout(owner, 'no-such-plan')).status).toBe(HttpStatus.BAD_REQUEST);
  });

  it('lets no unclaimed sandbox start checkout', async () => {
    const owner = await signUp(app, 'Owner');
    await markUnclaimedSandbox(owner);

    const response = await startCheckout(owner);

    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    expect(response.body).toMatchObject({
      code: EntitlementErrorCode.SandboxClaimRequired,
      restriction: SandboxRestriction.Subscribe,
    });
    enforcement.enforced = true;
    expect((await createProduct(owner)).status).toBe(HttpStatus.CREATED);
  });

  it('follows the subscription through trial, plan change, failure and cancellation', async () => {
    const owner = await signUp(app, 'Owner');
    const organizationId = await organizationOf(owner);
    await startCheckout(owner);
    const customerId = `cus_${organizationId}`;
    const id = `sub_${randomUUID()}`;
    enforcement.enforced = true;

    await providerHolds(
      fakeSubscription({
        id,
        customerId,
        organizationId,
        status: SubscriptionStatus.TRIALING,
        trialEnd: new Date('2026-11-14'),
      }),
      organizationId,
    );
    expect((await billingOf(owner)).body).toMatchObject({
      status: SubscriptionStatus.TRIALING,
      trialEnd: '2026-11-14T00:00:00.000Z',
      trialAvailable: false,
      access: { state: SubscriptionAccessState.Trialing, writable: true },
    });
    expect((await createProduct(owner)).status).toBe(HttpStatus.CREATED);
    expect((await startCheckout(owner)).status).toBe(HttpStatus.CONFLICT);

    await providerHolds(
      fakeSubscription({
        id,
        customerId,
        priceLookupKeys: ['crossmart_growth_annual'],
        interval: BillingInterval.ANNUAL,
      }),
      null,
    );
    expect((await billingOf(owner)).body).toMatchObject({
      status: SubscriptionStatus.ACTIVE,
      interval: BillingInterval.ANNUAL,
      plan: { code: 'growth' },
    });

    await providerHolds(
      fakeSubscription({ id, customerId, status: SubscriptionStatus.PAST_DUE }),
      null,
    );
    expect((await billingOf(owner)).body.access.state).toBe(SubscriptionAccessState.PastDueGrace);

    await providerHolds(
      fakeSubscription({ id, customerId, status: SubscriptionStatus.CANCELED }),
      null,
    );
    expect((await createProduct(owner)).status).toBe(HttpStatus.PAYMENT_REQUIRED);
    const portal = await request(server())
      .post(`/api/v1/organizations/${organizationId}/billing/portal-sessions`)
      .set('Cookie', owner.cookie);
    expect(portal.body).toEqual({ url: FAKE_PORTAL_URL });
    expect(provider.portals.at(-1)).toBe(customerId);
  });

  it('handles a redelivered event once, and refuses unsigned deliveries', async () => {
    const owner = await signUp(app, 'Owner');
    const organizationId = await organizationOf(owner);
    const subscription = fakeSubscription({
      id: `sub_${randomUUID()}`,
      customerId: `cus_${randomUUID()}`,
      organizationId,
    });
    provider.subscriptions.set(subscription.id, subscription);
    const event = { id: `evt_${randomUUID()}`, subscriptionId: subscription.id };

    expect((await deliver(event)).status).toBe(HttpStatus.OK);
    expect((await deliver(event)).status).toBe(HttpStatus.OK);
    expect(await prisma.billingWebhookEvent.count({ where: { id: event.id } })).toBe(1);

    expect((await deliver({ id: `evt_${randomUUID()}` }, 'forged')).status).toBe(
      HttpStatus.BAD_REQUEST,
    );
  });

  async function userIdOf(user: SignedUpUser): Promise<string> {
    const me = await request(server()).get('/api/v1/me').set('Cookie', user.cookie);
    return me.body.id;
  }

  /** The organization as an AI agent's sandbox account its owner has not claimed (ADR 0019). */
  async function markUnclaimedSandbox(user: SignedUpUser): Promise<void> {
    await prisma.sandboxAccount.create({
      data: {
        organizationId: await organizationOf(user),
        workspaceId: user.workspaceId,
        userId: await userIdOf(user),
        claimTokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 86_400_000),
        claimEmailSentAt: new Date(),
      },
    });
  }
});
