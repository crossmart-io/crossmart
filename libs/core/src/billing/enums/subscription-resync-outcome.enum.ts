/** What resyncing one organization's subscription from the billing provider did. */
export enum SubscriptionResyncOutcome {
  /** The provider's subscription was applied to the organization's row. */
  Synced = 'synced',
  /** The organization never started a provider subscription, so there is nothing to read. */
  NoSubscription = 'no_subscription',
  /** No organization has this id. */
  NotFound = 'not_found',
  /** Reading or applying the subscription failed; the row is left as it was. */
  Failed = 'failed',
}
