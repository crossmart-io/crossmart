import type { SyncJobKind } from '../enums/sync-job-kind.enum.js';

/** The kinds of job that sync one listing. */
export type ListingJobKind = Exclude<SyncJobKind, SyncJobKind.ReconcileInventory>;

/** What delisting a deleted product needs, since its listing was deleted with it. */
export interface DeletedProductListing {
  externalId: string;
  productTitle: string;
}

/** Sync work for one product on one connection. Jobs for the same pair coalesce. */
export interface ListingSyncJob {
  kind: ListingJobKind;
  workspaceId: string;
  connectionId: string;
  productId: string;
  /** Set on a delist job for a product that was deleted from the catalog. */
  deleted?: DeletedProductListing;
  /** Set on inventory jobs of the reconciliation: only items the channel shows wrongly are sent. */
  reconcile?: boolean;
}

export interface SyncRequestResult {
  /** Products queued to be published or updated. */
  queued: number;
  /** Listings queued to be taken off the channel, as they are no longer selected. */
  delisting: number;
}
