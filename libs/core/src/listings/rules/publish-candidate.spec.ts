import { ListingVisibility, ProductStatus } from '@crossmart/database';
import { type CandidateProduct, publishCandidateOf } from './publish-candidate.js';

const PRODUCT: CandidateProduct = {
  status: ProductStatus.ACTIVE,
  optionNames: ['Size'],
  variantCount: 2,
  imageUrls: ['https://cdn.example.com/1.jpg'],
};

const FOLLOWS_PRODUCT = { override: { visibility: null } };
const HIDDEN = { override: { visibility: ListingVisibility.HIDDEN } };
const VISIBLE = { override: { visibility: ListingVisibility.VISIBLE } };

describe('publishCandidateOf', () => {
  it('carries the product’s images and options', () => {
    expect(publishCandidateOf(PRODUCT, null)).toEqual({
      imageUrls: PRODUCT.imageUrls,
      optionNames: ['Size'],
      variantCount: 2,
      active: true,
    });
  });

  it('is shown when the product is active, unless the store hides it', () => {
    expect(publishCandidateOf(PRODUCT, FOLLOWS_PRODUCT).active).toBe(true);
    expect(publishCandidateOf(PRODUCT, HIDDEN).active).toBe(false);
  });

  it('is shown for a draft product only when the store sets it visible', () => {
    const draft = { ...PRODUCT, status: ProductStatus.DRAFT };

    expect(publishCandidateOf(draft, null).active).toBe(false);
    expect(publishCandidateOf(draft, VISIBLE).active).toBe(true);
  });
});
