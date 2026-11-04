import { assignSkus, inventoryGroupKey } from './ebay-keys.js';
import { mugDraft, shirtDraft, VARIANT_M, VARIANT_S } from './ebay-listing.fixtures.js';

describe('assignSkus', () => {
  it('keeps valid, unique merchant SKUs and derives the others from the variant id', () => {
    const skus = assignSkus(shirtDraft().variants);

    expect(skus.get(VARIANT_S)).toBe('SHIRT-S');
    expect(skus.get(VARIANT_M)).toBe('CM22222222222242228222222222222222');
  });

  it('derives SKUs for variants that share one, and for SKUs over 50 characters', () => {
    const variants = shirtDraft().variants;
    variants[1].sku = 'SHIRT-S';
    expect([...assignSkus(variants).values()]).toEqual([
      'CM11111111111141118111111111111111',
      'CM22222222222242228222222222222222',
    ]);
    variants[0].sku = 'X'.repeat(51);
    expect(assignSkus(variants).get(VARIANT_S)).toBe('CM11111111111141118111111111111111');
  });

  it('keeps the SKU a variant was published with', () => {
    const variants = mugDraft().variants;
    variants[0].sku = 'NEW-SKU';
    variants[0].externalVariantId = 'OLD-SKU';

    expect([...assignSkus(variants).values()]).toEqual(['OLD-SKU']);
  });
});

describe('inventoryGroupKey', () => {
  it('is stable for a product and at most 50 characters', () => {
    const key = inventoryGroupKey('33333333-3333-4333-8333-333333333333');

    expect(key).toBe('CM33333333333343338333333333333333');
    expect(key.length).toBeLessThanOrEqual(50);
  });
});
