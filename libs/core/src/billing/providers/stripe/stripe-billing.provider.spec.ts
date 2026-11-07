import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import { BillingEventType } from '../../enums/billing-event-type.enum.js';
import {
  InvalidWebhookSignatureError,
  UnknownSubscriptionStatusError,
} from '../../errors/billing.errors.js';
import {
  FakeStripeFetch,
  signedStripeEvent,
  stripeFixture,
  TEST_WEBHOOK_SECRET,
} from '../../testing/fake-stripe.js';
import { StripeBillingProvider } from './stripe-billing.provider.js';

const ORGANIZATION_ID = '5f0c7c43-2f0a-4d8e-9a43-3b1f6c1d2e10';
const CHECKOUT = {
  organizationId: ORGANIZATION_ID,
  customerId: 'cus_TestCrossmart01',
  priceId: 'price_TestStarterMonthly',
  planCode: 'starter',
  trialDays: 7,
};
const RETURN_PAGES = {
  checkoutSuccessUrl: 'http://localhost:5173/settings/billing/checkout/success',
  checkoutCancelUrl: 'http://localhost:5173/settings/billing/checkout/canceled',
  portalReturnUrl: 'http://localhost:5173/settings/billing',
};

/** The lookup keys of a price search, which Stripe sends as `lookup_keys[0]`, `lookup_keys[1]`… */
function lookupKeysOf(params: URLSearchParams | undefined): string[] {
  return [...(params ?? [])].flatMap(([name, value]) =>
    name.startsWith('lookup_keys[') ? [value] : [],
  );
}

function setup(automaticTax = false, webhookSecret: string | null = TEST_WEBHOOK_SECRET) {
  const stripe = new FakeStripeFetch();
  const provider = new StripeBillingProvider(stripe.client(), webhookSecret, {
    automaticTax,
    returnPages: RETURN_PAGES,
    portalConfigurationId: 'bpc_TestCrossmart01',
  });
  return { stripe, provider };
}

describe('StripeBillingProvider', () => {
  it('finds recurring prices by lookup key', async () => {
    const { stripe, provider } = setup();
    stripe.reply('prices.json');

    const prices = await provider.findPrices([
      'crossmart_starter_monthly',
      'crossmart_starter_annual',
    ]);

    expect(prices).toEqual([
      {
        id: 'price_TestStarterMonthly',
        lookupKey: 'crossmart_starter_monthly',
        amount: 2900,
        currency: 'usd',
        interval: BillingInterval.MONTHLY,
      },
      {
        id: 'price_TestStarterAnnual',
        lookupKey: 'crossmart_starter_annual',
        amount: 27600,
        currency: 'usd',
        interval: BillingInterval.ANNUAL,
      },
    ]);
    const [request] = stripe.requests;
    expect(request?.path).toBe('/v1/prices');
    expect(lookupKeysOf(request?.params)).toEqual([
      'crossmart_starter_monthly',
      'crossmart_starter_annual',
    ]);
    expect(request?.params.get('active')).toBe('true');
  });

  it('asks for at most ten lookup keys at a time', async () => {
    const { stripe, provider } = setup();
    stripe.reply('prices.json').reply('prices.json');
    const keys = Array.from({ length: 12 }, (_, index) => `crossmart_plan${index}_monthly`);

    await provider.findPrices(keys);

    expect(stripe.requests.map((request) => lookupKeysOf(request.params).length)).toEqual([10, 2]);
  });

  it('creates one customer per organization, tagged with it', async () => {
    const { stripe, provider } = setup();
    stripe.reply('customer.json');

    const customerId = await provider.createCustomer({
      organizationId: ORGANIZATION_ID,
      name: 'Ana Ceramics',
      email: 'owner@example.com',
    });

    expect(customerId).toBe('cus_TestCrossmart01');
    const [request] = stripe.requests;
    expect(request?.params.get('metadata[organization_id]')).toBe(ORGANIZATION_ID);
    expect(request?.idempotencyKey).toBe(`crossmart-customer-${ORGANIZATION_ID}`);
  });

  it('starts a subscription checkout with a trial that needs a card', async () => {
    const { stripe, provider } = setup();
    stripe.reply('checkout-session.json');

    const session = await provider.createCheckoutSession(CHECKOUT);

    expect(session.url).toBe('https://checkout.stripe.com/c/pay/cs_test_Crossmart01');
    const params = stripe.paramsOf(0);
    expect(params.get('mode')).toBe('subscription');
    expect(params.get('payment_method_collection')).toBe('always');
    expect(params.get('client_reference_id')).toBe(ORGANIZATION_ID);
    expect(params.get('line_items[0][price]')).toBe('price_TestStarterMonthly');
    expect(params.get('subscription_data[trial_period_days]')).toBe('7');
    expect(
      params.get('subscription_data[trial_settings][end_behavior][missing_payment_method]'),
    ).toBe('cancel');
    expect(params.get('subscription_data[metadata][organization_id]')).toBe(ORGANIZATION_ID);
    expect(params.get('success_url')).toBe(RETURN_PAGES.checkoutSuccessUrl);
    expect(params.get('cancel_url')).toBe(RETURN_PAGES.checkoutCancelUrl);
    expect(params.has('automatic_tax[enabled]')).toBe(false);
  });

  it('starts paying at once without a trial, and computes tax when Stripe Tax is on', async () => {
    const { stripe, provider } = setup(true);
    stripe.reply('checkout-session.json');

    await provider.createCheckoutSession({ ...CHECKOUT, trialDays: 0 });

    const params = stripe.paramsOf(0);
    expect(params.has('subscription_data[trial_period_days]')).toBe(false);
    expect(params.get('automatic_tax[enabled]')).toBe('true');
    expect(params.get('customer_update[address]')).toBe('auto');
  });

  it('opens the billing portal for the customer', async () => {
    const { stripe, provider } = setup();
    stripe.reply('portal-session.json');

    const session = await provider.createPortalSession('cus_TestCrossmart01');

    expect(session.url).toBe('https://billing.stripe.com/p/session/test_Crossmart01');
    expect(stripe.requests[0]?.path).toBe('/v1/billing_portal/sessions');
    expect(stripe.paramsOf(0).get('return_url')).toBe(RETURN_PAGES.portalReturnUrl);
    expect(stripe.paramsOf(0).get('configuration')).toBe('bpc_TestCrossmart01');
  });

  it('reads a trialing subscription in Crossmart’s terms', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-trialing.json');

    expect(await provider.getSubscription('sub_TestCrossmart01')).toEqual({
      id: 'sub_TestCrossmart01',
      customerId: 'cus_TestCrossmart01',
      organizationId: ORGANIZATION_ID,
      status: SubscriptionStatus.TRIALING,
      priceLookupKeys: ['crossmart_starter_monthly'],
      interval: BillingInterval.MONTHLY,
      currentPeriodEnd: new Date(1795161600 * 1000),
      trialEnd: new Date(1794556800 * 1000),
      cancelAtPeriodEnd: false,
      cancelAt: null,
    });
  });

  // The Customer Portal schedules a cancellation with `cancel_at` and leaves
  // `cancel_at_period_end` false, during a trial and after it (confirmed in Stripe test mode).
  it('reads a trial cancelled in the portal as ending at the trial end', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-trialing-cancel-at.json');

    expect(await provider.getSubscription('sub_TestCrossmart01')).toMatchObject({
      status: SubscriptionStatus.TRIALING,
      trialEnd: new Date(1794556800 * 1000),
      cancelAtPeriodEnd: true,
      cancelAt: new Date(1794556800 * 1000),
    });
  });

  it('reads a paid subscription cancelled in the portal as ending at the period end', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-active-cancel-at.json');

    expect(await provider.getSubscription('sub_TestCrossmart01')).toMatchObject({
      status: SubscriptionStatus.ACTIVE,
      cancelAtPeriodEnd: true,
      cancelAt: new Date(1825660800 * 1000),
    });
  });

  it('dates a cancellation flagged only at the period end by the trial end while trialing', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-trialing-cancel-at-period-end.json');

    expect(await provider.getSubscription('sub_TestCrossmart01')).toMatchObject({
      currentPeriodEnd: new Date(1795161600 * 1000),
      cancelAtPeriodEnd: true,
      cancelAt: new Date(1794556800 * 1000),
    });
  });

  it('reads no cancellation for a subscription that renews', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-active-annual.json');

    expect(await provider.getSubscription('sub_TestCrossmart01')).toMatchObject({
      cancelAtPeriodEnd: false,
      cancelAt: null,
    });
  });

  it('reads an annual plan, and a subscription made elsewhere without metadata', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-active-annual.json').reply('subscription-canceled.json');

    expect(await provider.getSubscription('sub_TestCrossmart01')).toMatchObject({
      status: SubscriptionStatus.ACTIVE,
      interval: BillingInterval.ANNUAL,
      priceLookupKeys: ['crossmart_growth_annual'],
    });
    expect(await provider.getSubscription('sub_TestCrossmart01')).toMatchObject({
      status: SubscriptionStatus.CANCELED,
      organizationId: null,
    });
  });

  it('refuses a status Crossmart does not know, rather than guessing', async () => {
    const { stripe, provider } = setup();
    stripe.reply('subscription-unknown-status.json');

    await expect(provider.getSubscription('sub_TestCrossmart01')).rejects.toBeInstanceOf(
      UnknownSubscriptionStatusError,
    );
  });

  describe('parseWebhook', () => {
    it.each([
      ['event-checkout-completed.json', BillingEventType.CheckoutCompleted, ORGANIZATION_ID],
      ['event-subscription-updated.json', BillingEventType.SubscriptionChanged, null],
      ['event-subscription-cancel-scheduled.json', BillingEventType.SubscriptionChanged, null],
      ['event-subscription-deleted.json', BillingEventType.SubscriptionChanged, null],
      ['event-trial-will-end.json', BillingEventType.TrialWillEnd, null],
      ['event-invoice-paid.json', BillingEventType.InvoicePaid, null],
      ['event-invoice-payment-failed.json', BillingEventType.PaymentFailed, null],
    ])('reads %s as %s, naming the subscription', (fixture, type, organizationId) => {
      const { provider } = setup();
      const { payload, signature } = signedStripeEvent(fixture);

      expect(provider.parseWebhook(payload, signature)).toMatchObject({
        type,
        subscriptionId: 'sub_TestCrossmart01',
        customerId: 'cus_TestCrossmart01',
        organizationId,
      });
    });

    it('leaves events Crossmart does not act on without a type', () => {
      const { provider } = setup();
      const { payload, signature } = signedStripeEvent('event-customer-updated.json');

      expect(provider.parseWebhook(payload, signature)).toEqual({
        id: 'evt_TestCustomerUpdated',
        providerType: 'customer.updated',
        type: null,
        subscriptionId: null,
        customerId: null,
        organizationId: null,
      });
    });

    it('ignores the subscription of a checkout that was not for one', () => {
      const { provider } = setup();
      const { payload, signature } = signedStripeEvent('event-checkout-payment-mode.json');

      expect(provider.parseWebhook(payload, signature)).toMatchObject({ subscriptionId: null });
    });

    it('refuses a delivery with a forged or missing signature', () => {
      const { provider } = setup();
      const payload = Buffer.from(stripeFixture('event-invoice-paid.json'));
      const forged = signedStripeEvent('event-invoice-paid.json').signature.replace(
        /v1=[0-9a-f]{4}/,
        'v1=0000',
      );

      expect(() => provider.parseWebhook(payload, forged)).toThrow(InvalidWebhookSignatureError);
      expect(() => provider.parseWebhook(payload, undefined)).toThrow(InvalidWebhookSignatureError);
    });

    it('refuses every delivery while no webhook secret is set', () => {
      const { provider } = setup(false, null);
      const { payload, signature } = signedStripeEvent('event-invoice-paid.json');

      expect(() => provider.parseWebhook(payload, signature)).toThrow(InvalidWebhookSignatureError);
    });
  });
});
