/**
 * Where a catalog product stands on one connection. Every product is in exactly one state:
 * the selection says whether it should be on the channel, its listing whether it is.
 */
export enum ChannelProductState {
  /** Selected and on the channel (for sale, or there as a draft). */
  Listed = 'listed',
  /** Selected but not on the channel yet: the next sync publishes it. */
  Pending = 'pending',
  /** Its last publish, update or delist failed. */
  Failed = 'failed',
  /** On the channel but no longer selected: the next sync delists it. */
  Removing = 'removing',
  /** Removed from the store by hand and off the channel; adding it back undoes that. */
  RemovedByHand = 'removed_by_hand',
  /** Neither selected nor on the channel, and never removed by hand. */
  Excluded = 'excluded',
}

/** What a connection's product list can be sorted by. */
export enum ChannelProductSort {
  Title = 'title',
  Updated = 'updatedAt',
}
