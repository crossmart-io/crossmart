/** Who bills Crossmart Cloud customers (ADR 0024). `none` turns billing off, as self-hosting runs. */
export enum BillingDriver {
  None = 'none',
  Stripe = 'stripe',
}
