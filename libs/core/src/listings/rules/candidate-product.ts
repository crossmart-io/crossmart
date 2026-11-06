import type { ProductDetail } from '../../catalog/entities/product-views.js';
import type { ListingSyncRecord } from '../repositories/listing-sync.queries.js';
import { effectiveImageUrls } from './listing-images.js';
import type { CandidateProduct } from './publish-candidate.js';

/** A product with its listing on one store, as that store's connector checks it before sending. */
export function candidateProductOf(
  product: ProductDetail,
  listing: Pick<ListingSyncRecord, 'override'> | null,
): CandidateProduct {
  return {
    status: product.status,
    optionNames: product.optionNames,
    variantCount: product.variants.length,
    imageUrls: effectiveImageUrls(
      product.media.map((media) => media.url),
      listing?.override ?? null,
    ),
  };
}
