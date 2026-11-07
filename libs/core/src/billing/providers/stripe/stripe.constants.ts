import { BillingInterval, SubscriptionStatus } from '@crossmart/database';
import { BillingEventType } from '../../enums/billing-event-type.enum.js';

/** The Stripe webhook events Crossmart subscribes to (ADR 0024); select these on the endpoint. */
export const STRIPE_EVENT = {
  CheckoutSessionCompleted: 'checkout.session.completed',
  SubscriptionCreated: 'customer.subscription.created',
  SubscriptionUpdated: 'customer.subscription.updated',
  SubscriptionDeleted: 'customer.subscription.deleted',
  SubscriptionTrialWillEnd: 'customer.subscription.trial_will_end',
  InvoicePaid: 'invoice.paid',
  InvoicePaymentFailed: 'invoice.payment_failed',
} as const;

/** What each subscribed Stripe event means to Crossmart. */
export const STRIPE_EVENT_TYPES: Readonly<Record<string, BillingEventType>> = {
  [STRIPE_EVENT.CheckoutSessionCompleted]: BillingEventType.CheckoutCompleted,
  [STRIPE_EVENT.SubscriptionCreated]: BillingEventType.SubscriptionChanged,
  [STRIPE_EVENT.SubscriptionUpdated]: BillingEventType.SubscriptionChanged,
  [STRIPE_EVENT.SubscriptionDeleted]: BillingEventType.SubscriptionChanged,
  [STRIPE_EVENT.SubscriptionTrialWillEnd]: BillingEventType.TrialWillEnd,
  [STRIPE_EVENT.InvoicePaid]: BillingEventType.InvoicePaid,
  [STRIPE_EVENT.InvoicePaymentFailed]: BillingEventType.PaymentFailed,
};

/** Stripe's subscription statuses in Crossmart's terms. `incomplete_expired` never started. */
export const STRIPE_SUBSCRIPTION_STATUSES: Readonly<Record<string, SubscriptionStatus>> = {
  active: SubscriptionStatus.ACTIVE,
  trialing: SubscriptionStatus.TRIALING,
  past_due: SubscriptionStatus.PAST_DUE,
  canceled: SubscriptionStatus.CANCELED,
  incomplete: SubscriptionStatus.INCOMPLETE,
  incomplete_expired: SubscriptionStatus.CANCELED,
  unpaid: SubscriptionStatus.UNPAID,
  paused: SubscriptionStatus.PAUSED,
};

/** Stripe's recurring intervals Crossmart sells; others (week, day) are never set up. */
export const STRIPE_INTERVALS: Readonly<Record<string, BillingInterval>> = {
  month: BillingInterval.MONTHLY,
  year: BillingInterval.ANNUAL,
};

/** Stripe's `interval` for each of Crossmart's. */
export const STRIPE_INTERVAL_NAMES = {
  [BillingInterval.MONTHLY]: 'month',
  [BillingInterval.ANNUAL]: 'year',
} as const satisfies Record<BillingInterval, string>;

/** Stripe accepts at most this many lookup keys in one price search. */
export const STRIPE_MAX_LOOKUP_KEYS = 10;
/** Stripe timestamps are Unix seconds. */
export const MS_PER_SECOND = 1000;
/** Retries the Stripe client makes on network errors and 409/429/5xx, with idempotency keys. */
export const STRIPE_MAX_NETWORK_RETRIES = 2;
/** Repeating customer creation for one organization within a day returns the same customer. */
export const CUSTOMER_IDEMPOTENCY_PREFIX = 'crossmart-customer-';
/** A trial whose card is gone at its end cancels instead of billing nothing. */
export const TRIAL_END_WITHOUT_PAYMENT_METHOD = 'cancel';
export const STRIPE_APP_INFO = { name: 'Crossmart', url: 'https://crossmart.io' } as const;
