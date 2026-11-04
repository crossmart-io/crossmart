import type { ChannelSession } from '../auth/channel-session.js';

/** A category on a channel's taxonomy, such as an eBay leaf category. */
export interface ChannelCategory {
  id: string;
  /** The category with its ancestors, as the channel shows it: "Home & Garden > Kitchen > Mugs". */
  name: string;
}

/** `ChannelCapability.ProvideTaxonomy`: the channel's categories, to choose where a listing goes. */
export interface TaxonomyProvider {
  /** Categories that fit `query` (a product title or keywords), best match first. */
  suggestCategories(session: ChannelSession, query: string): Promise<ChannelCategory[]>;
}
