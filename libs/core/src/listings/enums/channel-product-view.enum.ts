/** The views a store's product list is read in, as a merchant thinks of them. */
export enum ChannelProductView {
  /** The products in the store, as the list shows them without any filter. */
  All = 'all',
  /** On the channel: listed. */
  Live = 'live',
  /** Failed, or needing details before they can be published. */
  NeedsAttention = 'needs_attention',
  /** Not live: pending, removing, removed by hand, or not in the store. */
  NotListed = 'not_listed',
}
