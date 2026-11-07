/**
 * The billing provider events Crossmart acts on (ADR 0024), named for what happened rather than
 * by any one provider. Each provider maps its own event names to these.
 */
export enum BillingEventType {
  /** Checkout finished: the organization has a customer and a subscription. */
  CheckoutCompleted = 'checkout_completed',
  /** A subscription was created, changed (plan, interval, cancellation) or ended. */
  SubscriptionChanged = 'subscription_changed',
  InvoicePaid = 'invoice_paid',
  PaymentFailed = 'payment_failed',
  /** The trial ends in a few days; the card on file is charged then. */
  TrialWillEnd = 'trial_will_end',
}
