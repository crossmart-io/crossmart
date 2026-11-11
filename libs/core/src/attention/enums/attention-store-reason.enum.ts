/** Why a store needs the merchant. */
export enum AttentionStoreReason {
  /** The channel no longer accepts Crossmart's access: the store must be connected again. */
  NeedsReauth = 'needs_reauth',
  /** The last sync or account check failed for another reason; see `statusReason`. */
  Error = 'error',
  /**
   * Disconnected while it still has live listings, which Crossmart can no longer update: their
   * stock is not kept in sync, so an item could sell twice.
   */
  DisconnectedWithListings = 'disconnected_with_listings',
}
