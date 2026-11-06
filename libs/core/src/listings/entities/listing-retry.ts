/** One product on one store, as a retry names it. */
export interface ListingRetryTarget {
  workspaceId: string;
  productId: string;
  connectionId: string;
}

/** A retry about to be queued, with the names the activity log shows. */
export interface ListingRequeue extends ListingRetryTarget {
  productTitle: string;
  storeName: string;
}
