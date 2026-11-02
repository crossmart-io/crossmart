import type { ProductUpdateTargetRecord } from '../../repositories/product.queries.js';
import { productDraft } from './__testing__/product-draft.factory.js';
import { mergeWithExisting } from './existing-product-merge.js';

function existing(overrides: Partial<ProductUpdateTargetRecord> = {}): ProductUpdateTargetRecord {
  return {
    id: 'product-1',
    handle: 'tee',
    variants: [
      {
        id: 'variant-small',
        sku: 'TEE-S',
        optionValues: ['S0'],
        inventoryItem: { tracked: true, available: 40 },
      },
      {
        id: 'variant-medium',
        sku: null,
        optionValues: ['S1'],
        inventoryItem: { tracked: false, available: 0 },
      },
    ],
    media: [{ url: 'https://cdn.example.com/tee.jpg', altText: null }],
    ...overrides,
  };
}

describe('mergeWithExisting', () => {
  it('matches variants by SKU, then by options, and keeps their stock', () => {
    const draft = productDraft('tee', 'TEE-S', 'TEE-M', 'TEE-L');

    const merged = mergeWithExisting(draft, existing());

    expect(merged.variants.map((variant) => variant.id)).toEqual([
      'variant-small',
      'variant-medium',
      undefined,
    ]);
    expect(merged.variants.map((variant) => variant.inventory)).toEqual([
      { tracked: true, quantity: 40 },
      { tracked: false, quantity: 0 },
      { tracked: true, quantity: 1 },
    ]);
  });

  it('prefers a SKU match over an earlier option match', () => {
    const draft = productDraft('tee', 'NEW-SKU', 'TEE-S');

    const merged = mergeWithExisting(draft, existing());

    expect(merged.variants.map((variant) => variant.id)).toEqual([undefined, 'variant-small']);
  });

  it('keeps the catalog images unless the file lists some', () => {
    const withoutImages = mergeWithExisting(productDraft('tee', 'TEE-S'), existing());
    expect(withoutImages.media).toEqual([{ url: 'https://cdn.example.com/tee.jpg' }]);

    const fileImages = [{ url: 'https://cdn.example.com/new.jpg' }];
    const withImages = mergeWithExisting(
      { ...productDraft('tee', 'TEE-S'), media: fileImages },
      existing(),
    );
    expect(withImages.media).toEqual(fileImages);
  });
});
