import type { CategoryAspect, ChannelCategory, ItemSpecific } from '@crossmart/connectors';

/** A listing's item specifics, with the ones its channel category asks for. */
export interface ListingItemSpecificsView {
  /** The category the aspects are read for; null until one is chosen or picked on publish. */
  category: ChannelCategory | null;
  /** The category's item specifics, required ones first; none without a category. */
  aspects: CategoryAspect[];
  /** The values the merchant set, by aspect name. */
  values: ItemSpecific[];
}

/** What is stored for a listing: its category and the item specifics set on it. */
export interface StoredItemSpecifics {
  category: ChannelCategory | null;
  values: ItemSpecific[];
}
