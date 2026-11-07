/**
 * The read-only lookups Ask may run on the caller's workspace to answer an account question.
 * The model can only name these; none of them changes anything.
 */
export enum AccountLookupKind {
  /** Where a product (found by SKU or title) stands on each store, with its last error. */
  ListingStatus = 'listing_status',
  /** The organization's plan, its limits and current usage. */
  PlanUsage = 'plan_usage',
  /** The workspace's store connections and their status. */
  ChannelConnections = 'channel_connections',
  /** The latest listings the stores refused. */
  FailedListings = 'failed_listings',
}
