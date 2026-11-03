import { externalVariant } from '../testing/external-product.factory.js';
import { matchVariants } from './variant-matching.js';

const catalog = [
  { id: 'v-small', sku: 'TEE-S', optionValues: ['Small'] },
  { id: 'v-large', sku: null, optionValues: ['Large'] },
  { id: 'v-xl', sku: 'TEE-XL', optionValues: ['XL'] },
];

describe('matchVariants', () => {
  it('matches known mappings first, then SKUs, then option values, in channel order', () => {
    const result = matchVariants(
      [
        externalVariant('ext-large', { optionValues: [' large '] }),
        externalVariant('ext-small', { sku: 'TEE-S', optionValues: ['Medium'] }),
        externalVariant('ext-xl', { sku: 'OTHER', optionValues: ['Small'] }),
      ],
      catalog,
      new Map([['ext-xl', 'v-xl']]),
    );

    expect(result.mappings.map(({ externalId, variantId }) => [externalId, variantId])).toEqual([
      ['ext-large', 'v-large'],
      ['ext-small', 'v-small'],
      ['ext-xl', 'v-xl'],
    ]);
    expect(result.mappings[0]?.externalInventoryId).toBe('ext-large-inventory');
    expect(result.unmatched).toEqual([]);
  });

  it('uses each catalog variant once and reports what is left', () => {
    const result = matchVariants(
      [
        externalVariant('first', { sku: 'TEE-S' }),
        externalVariant('second', { sku: 'TEE-S' }),
        externalVariant('third', { optionValues: ['Huge'] }),
      ],
      catalog,
    );

    expect(result.mappings.map((mapping) => mapping.externalId)).toEqual(['first']);
    expect(result.unmatched.map((variant) => variant.externalId)).toEqual(['second', 'third']);
  });

  it('pairs two lone variants that share nothing, such as products without options', () => {
    const result = matchVariants(
      [externalVariant('only', { sku: 'NEW-SKU' })],
      [{ id: 'v-only', sku: 'OLD-SKU', optionValues: [] }],
    );

    expect(result.mappings).toEqual([
      { variantId: 'v-only', externalId: 'only', externalInventoryId: 'only-inventory' },
    ]);
  });

  it('ignores a known mapping to a variant that no longer exists', () => {
    const result = matchVariants(
      [externalVariant('ext', { sku: 'TEE-XL' })],
      catalog,
      new Map([['ext', 'deleted-variant']]),
    );

    expect(result.mappings[0]?.variantId).toBe('v-xl');
  });
});
