import { SubscriptionStatus } from '@crossmart/database';
import type { BillingWebhookEvent } from '../entities/billing-webhook-event.js';
import { BillingEventType } from '../enums/billing-event-type.enum.js';
import { InvalidWebhookSignatureError } from '../errors/billing.errors.js';
import type { BillingAccountRepository } from '../repositories/billing-account.repository.js';
import type { BillingEventRepository } from '../repositories/billing-event.repository.js';
import {
  FAKE_WEBHOOK_SIGNATURE,
  FakeBillingProvider,
  fakeSubscription,
} from '../testing/fake-billing-provider.js';
import { billingReturnPages } from '../providers/billing-provider.factory.js';
import { StripeBillingProvider } from '../providers/stripe/stripe-billing.provider.js';
import { billingAccount } from '../testing/billing-account.fixtures.js';
import { FakeStripeFetch, signedStripeEvent, TEST_WEBHOOK_SECRET } from '../testing/fake-stripe.js';
import { BillingWebhookService } from './billing-webhook.service.js';
import { SubscriptionSyncService } from './subscription-sync.service.js';

const SUBSCRIPTION = fakeSubscription({ status: SubscriptionStatus.TRIALING });

function event(overrides: Partial<BillingWebhookEvent> = {}): Buffer {
  const body: BillingWebhookEvent = {
    id: 'evt_1',
    providerType: 'customer.subscription.updated',
    type: BillingEventType.SubscriptionChanged,
    subscriptionId: SUBSCRIPTION.id,
    customerId: SUBSCRIPTION.customerId,
    organizationId: null,
    ...overrides,
  };
  return Buffer.from(JSON.stringify(body));
}

function setup(claimed = true) {
  const provider = new FakeBillingProvider();
  provider.subscriptions.set(SUBSCRIPTION.id, SUBSCRIPTION);
  const events = {
    claim: vi.fn<BillingEventRepository['claim']>().mockResolvedValue(claimed),
    release: vi.fn<BillingEventRepository['release']>().mockResolvedValue(),
  };
  const accounts = {
    saveCustomerId: vi
      .fn<BillingAccountRepository['saveCustomerId']>()
      .mockResolvedValue('cus_fake'),
  };
  const sync = { apply: vi.fn<SubscriptionSyncService['apply']>().mockResolvedValue() };
  const service = new BillingWebhookService(
    provider,
    events as unknown as BillingEventRepository,
    accounts as unknown as BillingAccountRepository,
    sync as unknown as SubscriptionSyncService,
  );
  return { service, events, accounts, sync };
}

describe('BillingWebhookService', () => {
  it('reconciles the subscription as the provider holds it now', async () => {
    const { service, events, sync } = setup();

    await service.handle(event(), FAKE_WEBHOOK_SIGNATURE);

    expect(events.claim).toHaveBeenCalledWith('evt_1', 'customer.subscription.updated');
    expect(sync.apply).toHaveBeenCalledWith(SUBSCRIPTION, null);
  });

  it('links the customer and names the organization on a completed checkout', async () => {
    const { service, accounts, sync } = setup();

    await service.handle(
      event({ type: BillingEventType.CheckoutCompleted, organizationId: 'org-1' }),
      FAKE_WEBHOOK_SIGNATURE,
    );

    expect(accounts.saveCustomerId).toHaveBeenCalledWith('org-1', 'cus_fake');
    expect(sync.apply).toHaveBeenCalledWith(SUBSCRIPTION, 'org-1');
  });

  it('handles a redelivered event once', async () => {
    const { service, sync } = setup(false);

    await service.handle(event(), FAKE_WEBHOOK_SIGNATURE);

    expect(sync.apply).not.toHaveBeenCalled();
  });

  it('acknowledges events it does not act on without recording them', async () => {
    const { service, events, sync } = setup();

    await service.handle(
      event({ type: null, providerType: 'customer.updated' }),
      FAKE_WEBHOOK_SIGNATURE,
    );

    expect(events.claim).not.toHaveBeenCalled();
    expect(sync.apply).not.toHaveBeenCalled();
  });

  it('releases a failed event so the provider’s retry handles it again', async () => {
    const { service, events, sync } = setup();
    sync.apply.mockRejectedValueOnce(new Error('database down'));

    await expect(service.handle(event(), FAKE_WEBHOOK_SIGNATURE)).rejects.toThrow('database down');

    expect(events.release).toHaveBeenCalledWith('evt_1');
  });

  it('refuses an unsigned delivery before reading anything', async () => {
    const { service, events } = setup();

    await expect(service.handle(event(), 'forged')).rejects.toBeInstanceOf(
      InvalidWebhookSignatureError,
    );
    expect(events.claim).not.toHaveBeenCalled();
  });
});

describe('BillingWebhookService with Stripe', () => {
  it('records a cancellation the Customer Portal schedules for the trial end', async () => {
    const stripe = new FakeStripeFetch();
    stripe.reply('subscription-trialing-cancel-at.json');
    const provider = new StripeBillingProvider(stripe.client(), TEST_WEBHOOK_SECRET, {
      automaticTax: false,
      portalConfigurationId: null,
      returnPages: billingReturnPages('http://localhost:5173'),
    });
    const accounts = {
      findByOrganization: vi.fn<BillingAccountRepository['findByOrganization']>().mockResolvedValue(
        billingAccount({
          status: SubscriptionStatus.TRIALING,
          externalCustomerId: 'cus_TestCrossmart01',
          externalSubscriptionId: 'sub_TestCrossmart01',
        }),
      ),
      applySubscription: vi.fn<BillingAccountRepository['applySubscription']>().mockResolvedValue(),
    };
    const repository = accounts as unknown as BillingAccountRepository;
    const events = {
      claim: vi.fn<BillingEventRepository['claim']>().mockResolvedValue(true),
      release: vi.fn<BillingEventRepository['release']>().mockResolvedValue(),
    };
    const service = new BillingWebhookService(
      provider,
      events as unknown as BillingEventRepository,
      repository,
      new SubscriptionSyncService(repository),
    );
    const { payload, signature } = signedStripeEvent('event-subscription-cancel-scheduled.json');

    await service.handle(payload, signature);

    const trialEnd = new Date(1794556800 * 1000);
    expect(stripe.requests[0]?.path).toBe('/v1/subscriptions/sub_TestCrossmart01');
    expect(accounts.applySubscription).toHaveBeenCalledWith(
      '5f0c7c43-2f0a-4d8e-9a43-3b1f6c1d2e10',
      expect.objectContaining({
        status: SubscriptionStatus.TRIALING,
        trialEnd,
        cancelAtPeriodEnd: true,
        cancelAt: trialEnd,
      }),
    );
  });
});
