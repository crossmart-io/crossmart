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
import { BillingWebhookService } from './billing-webhook.service.js';
import type { SubscriptionSyncService } from './subscription-sync.service.js';

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
