/** Machine-readable reasons a retry is refused (409), sent as `code` in the error body. */
export enum ListingRetryErrorCode {
  /** The store needs re-auth, was disconnected or is in error: connect it again first. */
  StoreNotConnected = 'store_not_connected',
  /** The store's selection does not include the product: add it to the store first. */
  ProductNotInStore = 'product_not_in_store',
}
