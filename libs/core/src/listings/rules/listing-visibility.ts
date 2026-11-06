import { ListingStatus, ListingVisibility, type Prisma, ProductStatus } from '@crossmart/database';

export interface VisibleListing {
  override: { visibility: ListingVisibility | null } | null;
}

/** Visible on the channel when the merchant says so, else when the product is active. */
export function isShownOnChannel(
  product: { status: ProductStatus },
  listing: VisibleListing | null,
): boolean {
  const visibility = listing?.override?.visibility;
  if (visibility === ListingVisibility.VISIBLE) return true;
  if (visibility === ListingVisibility.HIDDEN) return false;
  return product.status === ProductStatus.ACTIVE;
}

/** Whether publishing the listing makes it a new active listing: shown, and not live yet. */
export function wouldGoLive(
  product: { status: ProductStatus },
  listing: VisibleListing & { status: ListingStatus },
): boolean {
  return listing.status !== ListingStatus.ACTIVE && isShownOnChannel(product, listing);
}

/**
 * Products of `where` that publishing to the connection would make new active listings, by the
 * same rule as `wouldGoLive`: shown on the channel, and not live there already.
 */
export function goingLiveWhere(
  connectionId: string,
  where: Prisma.ProductWhereInput,
): Prisma.ProductWhereInput {
  const overridden = (visibility: ListingVisibility): Prisma.ProductWhereInput => ({
    listings: { some: { connectionId, override: { visibility } } },
  });
  return {
    AND: [
      where,
      { NOT: { listings: { some: { connectionId, status: ListingStatus.ACTIVE } } } },
      {
        OR: [
          overridden(ListingVisibility.VISIBLE),
          { status: ProductStatus.ACTIVE, NOT: overridden(ListingVisibility.HIDDEN) },
        ],
      },
    ],
  };
}
