import type { SyncJobKind } from '../enums/sync-job-kind.enum.js';

/** The kinds of job that sync one listing. */
export type ListingJobKind = Exclude<SyncJobKind, SyncJobKind.ReconcileInventory>;

/** Sync work for one product on one connection. Jobs for the same pair coalesce. */
export interface ListingSyncJob {
  kind: ListingJobKind;
  workspaceId: string;
  connectionId: string;
  productId: string;
}

export interface SyncRequestResult {
  /** Products queued to be published or updated. */
  queued: number;
  /** Listings queued to be taken off the channel, as they are no longer selected. */
  delisting: number;
}
