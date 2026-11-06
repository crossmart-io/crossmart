/**
 * Where a product stands on one store, in the one word a merchant reads. It folds the
 * selection, the listing's status and what blocks publishing into a single state.
 */
export enum ListingDisplayState {
  /** Not selected for the store, and never on it. */
  Draft = 'draft',
  /** Selected, but the store's setup or the product lacks something publishing needs. */
  NeedsDetails = 'needs_details',
  /** Selected and publishable; not sent to the channel yet. */
  Ready = 'ready',
  /** Queued to be published, or being published. */
  Publishing = 'publishing',
  /** On the channel (for sale, or there hidden). */
  Published = 'published',
  /** The channel refused the last publish, update or delist. */
  Failed = 'failed',
  /** On the channel but no longer selected: it is being taken off. */
  Removing = 'removing',
  /** Taken off the channel, or removed from the store by hand. */
  Removed = 'removed',
}
