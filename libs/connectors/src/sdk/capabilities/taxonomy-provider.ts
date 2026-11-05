import type { ChannelSession } from '../auth/channel-session.js';

/** A category on a channel's taxonomy, such as an eBay leaf category. */
export interface ChannelCategory {
  id: string;
  /** The category with its ancestors, as the channel shows it: "Home & Garden > Kitchen > Mugs". */
  name: string;
}

/** How much the channel wants an item specific that is not required. */
export enum CategoryAspectUsage {
  /** Buyers filter by it; listings that have it are found more often. */
  Recommended = 'recommended',
  Optional = 'optional',
}

/** How a merchant gives an item specific's value. */
export enum CategoryAspectMode {
  /** Any text; the channel's values are suggestions. */
  FreeText = 'free_text',
  /** One of the channel's values only. */
  SelectionOnly = 'selection_only',
}

/** An item specific (an eBay aspect such as `Color`) that listings in a category can have. */
export interface CategoryAspect {
  /** The name as the channel shows it on the connection's marketplace: `Colour` on eBay UK. */
  name: string;
  /** Listings in the category are refused without it. */
  required: boolean;
  usage: CategoryAspectUsage;
  mode: CategoryAspectMode;
  /** Whether a listing may give it several values (`Features: ["Dishwasher Safe", …]`). */
  multiple: boolean;
  /** The channel's values, the first ones only when it has very many. */
  values: string[];
}

/** `ChannelCapability.ProvideTaxonomy`: the channel's categories, to choose where a listing goes. */
export interface TaxonomyProvider {
  /** Categories that fit `query` (a product title or keywords), best match first. */
  suggestCategories(session: ChannelSession, query: string): Promise<ChannelCategory[]>;
  /** The item specifics of a leaf category, required ones first. */
  categoryAspects(session: ChannelSession, categoryId: string): Promise<CategoryAspect[]>;
}
