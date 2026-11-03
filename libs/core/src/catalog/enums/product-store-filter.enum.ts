/** Filters the products table by the stores products are in. */
export enum ProductStoreFilter {
  /** In the store named by `storeId`. */
  InStore = 'in_store',
  /** Not in the store named by `storeId`: those to add to it. */
  NotInStore = 'not_in_store',
  /** In no store at all. */
  InNoStore = 'in_no_store',
  /** With a listing whose last sync failed, in any store. */
  WithErrors = 'with_errors',
}

/** What the products table can be sorted by. */
export enum ProductSort {
  Title = 'title',
  Updated = 'updatedAt',
  Created = 'createdAt',
}
