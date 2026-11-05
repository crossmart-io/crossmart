import { Injectable } from '@nestjs/common';
import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import type { CategoryAspect, ChannelCategory } from '../../sdk/capabilities/taxonomy-provider.js';
import { ChannelErrorCode } from '../../sdk/errors/channel-error-code.enum.js';
import type { EbayAccountContext } from '../api/ebay-account-context.js';
import { ebayError } from '../ebay-errors.js';
import { EbayCategoryAspectsReader } from '../taxonomy/ebay-category-aspects.reader.js';
import { EbayTaxonomyReader } from '../taxonomy/ebay-taxonomy.reader.js';
import { missingRequiredAspects } from './ebay-item-aspects.js';

export const NO_CATEGORY =
  'eBay suggested no category for this product. Choose an eBay category for it.';
const MISSING_ASPECTS_PREFIX = 'eBay requires these item specifics in this category: ';
const MISSING_ASPECTS_SUFFIX = '. Add them in the listing’s item specifics.';
const ASPECT_LIST_SEPARATOR = ', ';

/** The message for a listing sent without the category's required item specifics. */
export function missingAspectsMessage(names: readonly string[]): string {
  return `${MISSING_ASPECTS_PREFIX}${names.join(ASPECT_LIST_SEPARATOR)}${MISSING_ASPECTS_SUFFIX}`;
}

/**
 * The category a listing goes in, and the check that it has the category's required item
 * specifics, so a listing that eBay would refuse fails before the first write, naming all of
 * them at once.
 */
@Injectable()
export class EbayListingCategory {
  constructor(
    private readonly taxonomy: EbayTaxonomyReader,
    private readonly aspects: EbayCategoryAspectsReader,
  ) {}

  /** The listing's stored category, or eBay's best one for the title, which Crossmart stores. */
  async resolve(account: EbayAccountContext, draft: ListingDraft): Promise<ChannelCategory> {
    if (draft.category) return draft.category;
    const [best] = await this.taxonomy.suggest(account, draft.product.title);
    if (!best) {
      throw ebayError(ChannelErrorCode.RequestRejected, NO_CATEGORY);
    }
    return best;
  }

  /** Refuses a listing missing any of the category's required item specifics. */
  async assertRequiredAspects(
    account: EbayAccountContext,
    draft: ListingDraft,
    category: ChannelCategory,
  ): Promise<void> {
    const missing = missingRequiredAspects(draft, await this.categoryAspects(account, category));
    if (missing.length > 0) {
      throw ebayError(ChannelErrorCode.RequestRejected, missingAspectsMessage(missing));
    }
  }

  /**
   * The category's aspects, or none when eBay cannot say: the check is a shortcut, and eBay
   * still names a missing required aspect when it refuses the listing.
   */
  private async categoryAspects(
    account: EbayAccountContext,
    category: ChannelCategory,
  ): Promise<CategoryAspect[]> {
    try {
      return await this.aspects.read(account, category.id);
    } catch {
      return [];
    }
  }
}
