/** What a channel sync job does. Each kind runs on the queue of its priority. */
export enum SyncJobKind {
  /** Set stock on the channel: the highest priority. */
  Inventory = 'inventory',
  /** Set prices only. */
  Price = 'price',
  /** Publish or update the whole listing (it carries prices too). */
  Content = 'content',
  /** Take the listing off the channel. */
  Delist = 'delist',
  /** Re-send stock for every listing of every connection, to correct drift. */
  ReconcileInventory = 'reconcile_inventory',
}
