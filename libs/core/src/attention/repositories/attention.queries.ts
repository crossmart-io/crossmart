import type { Prisma } from '@crossmart/database';

const FIRST_IMAGE = { select: { url: true }, orderBy: { position: 'asc' }, take: 1 } as const;

/** What a failed-listing group shows, loaded with its product and store in the same query. */
export const FAILED_LISTING_SELECT = {
  productId: true,
  connectionId: true,
  lastError: true,
  missingRequirement: true,
  updatedAt: true,
  product: { select: { title: true, media: FIRST_IMAGE } },
  connection: { select: { channel: true, displayName: true } },
} satisfies Prisma.ListingSelect;

export type FailedListingRecord = Prisma.ListingGetPayload<{
  select: typeof FAILED_LISTING_SELECT;
}>;

/** A product's failed listings on one store. */
export interface FailedListingGroupRecord {
  productId: string;
  connectionId: string;
  failedListings: number;
  /** The group's latest failed listing. */
  latest: FailedListingRecord;
}
