import type { PublishCandidate } from '@crossmart/connectors';
import type { ProductStatus } from '@crossmart/database';
import { isShownOnChannel, type VisibleListing } from './listing-visibility.js';

/** The parts of a product a channel checks before it is sent. */
export interface CandidateProduct {
  status: ProductStatus;
  optionNames: readonly string[];
  variantCount: number;
  /** The image URLs the listing would send, in order. */
  imageUrls: readonly string[];
}

/**
 * What a store's connector checks about a product before publishing it: its images, options and
 * whether the listing would be shown, which follows the store's visibility override first.
 */
export function publishCandidateOf(
  product: CandidateProduct,
  listing: VisibleListing | null,
): PublishCandidate {
  return {
    imageUrls: product.imageUrls,
    optionNames: product.optionNames,
    variantCount: product.variantCount,
    active: isShownOnChannel(product, listing),
  };
}
