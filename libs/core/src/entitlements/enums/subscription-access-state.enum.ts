/**
 * Where an organization stands with billing (ADR 0024), and so whether it may change anything.
 * The first group keeps full access; the second is read-only while billing is enforced.
 */
export enum SubscriptionAccessState {
  /** Billing is off on this instance (self-hosting): nothing is restricted. */
  Unrestricted = 'unrestricted',
  /** An unclaimed sandbox account, which its own rules restrict instead (ADR 0019). */
  Sandbox = 'sandbox',
  /** In the free trial a first checkout starts; `until` is when it ends and the card is charged. */
  Trialing = 'trialing',
  Active = 'active',
  /** A payment failed and the provider is retrying; full access lasts until `until`. */
  PastDueGrace = 'past_due_grace',
  /** From before billing: full access without a subscription, until `until` when it is set. */
  Legacy = 'legacy',
  /** No subscription has started, or legacy access ended: a plan must be chosen. */
  SubscriptionRequired = 'subscription_required',
  /** A payment failed and the grace period is over. */
  PastDue = 'past_due',
  Canceled = 'canceled',
  /** The provider gave up retrying a payment. */
  Unpaid = 'unpaid',
  /** The trial ended without a payment method. */
  Paused = 'paused',
}
