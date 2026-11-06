import { ListingVisibility } from '@crossmart/database';
import type { ListingOverrideInput } from '../entities/listing-override.js';
import { applyOverridePatch } from './listing-override-patch.js';

const CURRENT: ListingOverrideInput = {
  title: 'Store title',
  descriptionHtml: '<p>Store copy</p>',
  vendor: 'Store brand',
  tags: ['sale'],
  mediaUrls: ['https://cdn.example.com/2.jpg'],
  visibility: ListingVisibility.VISIBLE,
  inventoryBuffer: 2,
  maxQuantity: 10,
  variantPrices: [
    { variantId: 'v-1', price: '79.00', compareAtPrice: '99.00' },
    { variantId: 'v-2', price: '49.00', compareAtPrice: null },
  ],
};

describe('applyOverridePatch', () => {
  it('keeps every override a patch leaves out', () => {
    expect(applyOverridePatch(CURRENT, {})).toEqual(CURRENT);
  });

  it('reverts a field set to null to the product, and keeps the others', () => {
    const patched = applyOverridePatch(CURRENT, { title: null, vendor: null, tags: null });

    expect(patched).toEqual({ ...CURRENT, title: null, vendor: null, tags: null });
  });

  it('changes a field a patch sets', () => {
    expect(applyOverridePatch(CURRENT, { maxQuantity: 3 }).maxQuantity).toBe(3);
  });

  it('merges variant prices per variant, and drops a variant whose prices are both null', () => {
    const patched = applyOverridePatch(CURRENT, {
      variantPrices: [
        { variantId: 'v-1', price: null, compareAtPrice: null },
        { variantId: 'v-3', price: '12.00', compareAtPrice: null },
      ],
    });

    expect(patched.variantPrices).toEqual([
      { variantId: 'v-2', price: '49.00', compareAtPrice: null },
      { variantId: 'v-3', price: '12.00', compareAtPrice: null },
    ]);
  });

  it('reverts only the compare-at price of a variant when its price is kept', () => {
    const patched = applyOverridePatch(CURRENT, {
      variantPrices: [{ variantId: 'v-1', price: '79.00', compareAtPrice: null }],
    });

    expect(patched.variantPrices[0]).toEqual({
      variantId: 'v-1',
      price: '79.00',
      compareAtPrice: null,
    });
  });
});
