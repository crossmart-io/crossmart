import Stripe from 'stripe';
import { chunk } from '@crossmart/common';
import { ORGANIZATION_ID_METADATA_KEY, PLAN_CODE_METADATA_KEY } from '../../billing.constants.js';
import type { BillingWebhookEvent } from '../../entities/billing-webhook-event.js';
import type {
  CheckoutRequest,
  HostedSession,
  BillingReturnPages,
  NewBillingCustomer,
} from '../../entities/billing-sessions.js';
import type { ProviderPrice } from '../../entities/provider-price.js';
import type { ProviderSubscription } from '../../entities/provider-subscription.js';
import { InvalidWebhookSignatureError } from '../../errors/billing.errors.js';
import { BillingProvider } from '../billing-provider.js';
import { toBillingWebhookEvent } from './stripe-event.mapper.js';
import { toProviderPrices, toProviderSubscription } from './stripe-subscription.mapper.js';
import {
  CUSTOMER_IDEMPOTENCY_PREFIX,
  STRIPE_MAX_LOOKUP_KEYS,
  TRIAL_END_WITHOUT_PAYMENT_METHOD,
} from './stripe.constants.js';

/** How checkout and the portal are set up beyond each request. */
export interface StripeSessionOptions {
  /** Whether Stripe Tax computes tax, which needs the customer's address. */
  automaticTax: boolean;
  returnPages: BillingReturnPages;
  /** The portal configuration that lets customers switch plans; null for Stripe's default. */
  portalConfigurationId: string | null;
}

const NO_CHECKOUT_URL = 'Stripe returned a checkout session without a URL';

/**
 * Billing through Stripe (ADR 0024): prices by lookup key, Stripe Checkout in subscription mode,
 * the Customer Portal, and signed webhooks. The secret key never leaves the client.
 */
export class StripeBillingProvider extends BillingProvider {
  constructor(
    private readonly stripe: Stripe,
    private readonly webhookSecret: string | null,
    private readonly sessions: StripeSessionOptions,
  ) {
    super();
  }

  async findPrices(lookupKeys: readonly string[]): Promise<ProviderPrice[]> {
    const pages = await Promise.all(
      chunk([...lookupKeys], STRIPE_MAX_LOOKUP_KEYS).map((keys) =>
        this.stripe.prices.list({ lookup_keys: keys, active: true, limit: STRIPE_MAX_LOOKUP_KEYS }),
      ),
    );
    return pages.flatMap((page) => page.data.flatMap(toProviderPrices));
  }

  async createCustomer({ organizationId, name, email }: NewBillingCustomer): Promise<string> {
    const customer = await this.stripe.customers.create(
      { name, email, metadata: { [ORGANIZATION_ID_METADATA_KEY]: organizationId } },
      { idempotencyKey: `${CUSTOMER_IDEMPOTENCY_PREFIX}${organizationId}` },
    );
    return customer.id;
  }

  async createCheckoutSession(request: CheckoutRequest): Promise<HostedSession> {
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: request.customerId,
      client_reference_id: request.organizationId,
      line_items: [{ price: request.priceId, quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: this.subscriptionData(request),
      success_url: this.sessions.returnPages.checkoutSuccessUrl,
      cancel_url: this.sessions.returnPages.checkoutCancelUrl,
      ...this.taxOptions(),
    });
    if (!session.url) throw new Error(NO_CHECKOUT_URL);
    return { url: session.url };
  }

  async createPortalSession(customerId: string): Promise<HostedSession> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: this.sessions.returnPages.portalReturnUrl,
      ...(this.sessions.portalConfigurationId
        ? { configuration: this.sessions.portalConfigurationId }
        : {}),
    });
    return { url: session.url };
  }

  async getSubscription(subscriptionId: string): Promise<ProviderSubscription> {
    return toProviderSubscription(await this.stripe.subscriptions.retrieve(subscriptionId));
  }

  parseWebhook(rawBody: Buffer, signature: string | undefined): BillingWebhookEvent {
    if (!this.webhookSecret || !signature) throw new InvalidWebhookSignatureError();
    try {
      return toBillingWebhookEvent(
        this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret),
      );
    } catch (error) {
      if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
        throw new InvalidWebhookSignatureError();
      }
      throw error;
    }
  }

  /** The organization goes on the subscription too, so its webhooks find it without the session. */
  private subscriptionData(
    request: CheckoutRequest,
  ): Stripe.Checkout.SessionCreateParams.SubscriptionData {
    const metadata = {
      [ORGANIZATION_ID_METADATA_KEY]: request.organizationId,
      [PLAN_CODE_METADATA_KEY]: request.planCode,
    };
    if (request.trialDays <= 0) return { metadata };
    return {
      metadata,
      trial_period_days: request.trialDays,
      trial_settings: {
        end_behavior: { missing_payment_method: TRIAL_END_WITHOUT_PAYMENT_METHOD },
      },
    };
  }

  private taxOptions(): Partial<Stripe.Checkout.SessionCreateParams> {
    if (!this.sessions.automaticTax) return {};
    return {
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_update: { address: 'auto', name: 'auto' },
    };
  }
}
