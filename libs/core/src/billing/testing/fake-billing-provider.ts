import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import type { BillingWebhookEvent } from '../entities/billing-webhook-event.js';
import type {
  CheckoutRequest,
  HostedSession,
  NewBillingCustomer,
} from '../entities/billing-sessions.js';
import type { ProviderPrice } from '../entities/provider-price.js';
import type { ProviderSubscription } from '../entities/provider-subscription.js';
import { InvalidWebhookSignatureError } from '../errors/billing.errors.js';
import { BillingProvider } from '../providers/billing-provider.js';

/** The signature the fake accepts; anything else is refused, as a real provider would. */
export const FAKE_WEBHOOK_SIGNATURE = 'fake-signature';
export const FAKE_CHECKOUT_URL = 'https://billing.example.test/checkout';
export const FAKE_PORTAL_URL = 'https://billing.example.test/portal';

/** A plan price as the fake provider sells it. */
export function fakePrice(
  planCode: string,
  interval: BillingInterval,
  amount: number,
): ProviderPrice {
  const name = interval === BillingInterval.MONTHLY ? 'monthly' : 'annual';
  return {
    id: `price_${planCode}_${name}`,
    lookupKey: `crossmart_${planCode}_${name}`,
    amount,
    currency: 'usd',
    interval,
  };
}

/** A provider subscription with sensible defaults, for webhook tests. */
export function fakeSubscription(overrides: Partial<ProviderSubscription>): ProviderSubscription {
  return {
    id: 'sub_fake',
    customerId: 'cus_fake',
    organizationId: null,
    status: SubscriptionStatus.ACTIVE,
    priceLookupKeys: ['crossmart_starter_monthly'],
    interval: BillingInterval.MONTHLY,
    currentPeriodEnd: new Date('2026-12-07T00:00:00.000Z'),
    trialEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

/**
 * A billing provider in memory, for tests: prices, customers, sessions and subscriptions are
 * whatever the test sets, webhooks are JSON `BillingWebhookEvent`s signed with
 * `FAKE_WEBHOOK_SIGNATURE`, and every request is recorded.
 */
export class FakeBillingProvider extends BillingProvider {
  readonly prices: ProviderPrice[] = [];
  readonly subscriptions = new Map<string, ProviderSubscription>();
  readonly customers: NewBillingCustomer[] = [];
  readonly checkouts: CheckoutRequest[] = [];
  /** The customers a portal was opened for. */
  readonly portals: string[] = [];

  findPrices(lookupKeys: readonly string[]): Promise<ProviderPrice[]> {
    return Promise.resolve(this.prices.filter((price) => lookupKeys.includes(price.lookupKey)));
  }

  createCustomer(customer: NewBillingCustomer): Promise<string> {
    this.customers.push(customer);
    return Promise.resolve(`cus_${customer.organizationId}`);
  }

  createCheckoutSession(request: CheckoutRequest): Promise<HostedSession> {
    this.checkouts.push(request);
    return Promise.resolve({ url: FAKE_CHECKOUT_URL });
  }

  createPortalSession(customerId: string): Promise<HostedSession> {
    this.portals.push(customerId);
    return Promise.resolve({ url: FAKE_PORTAL_URL });
  }

  getSubscription(subscriptionId: string): Promise<ProviderSubscription> {
    const subscription = this.subscriptions.get(subscriptionId);
    return subscription
      ? Promise.resolve(subscription)
      : Promise.reject(new Error(`No fake subscription ${subscriptionId}`));
  }

  parseWebhook(rawBody: Buffer, signature: string | undefined): BillingWebhookEvent {
    if (signature !== FAKE_WEBHOOK_SIGNATURE) throw new InvalidWebhookSignatureError();
    return JSON.parse(rawBody.toString()) as BillingWebhookEvent;
  }
}
