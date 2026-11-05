import type { ChannelCategory, ItemSpecific } from '@crossmart/connectors';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';

/** The channel category the listing is in, once chosen or picked. */
export function listingCategory(listing: ListingSyncRecord | null): ChannelCategory | null {
  if (!listing?.channelCategoryId) return null;
  return { id: listing.channelCategoryId, name: listing.channelCategoryName ?? '' };
}

/** The item specifics the merchant set on the listing. */
export function listingItemSpecifics(listing: ListingSyncRecord | null): ItemSpecific[] {
  return (listing?.itemSpecifics ?? []).map(({ name, values }) => ({ name, values }));
}
