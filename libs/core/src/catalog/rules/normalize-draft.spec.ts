import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type { ProductDraft } from '../entities/product-draft.js';
import { normalizeDraft } from './normalize-draft.js';

const DRAFT: ProductDraft = {
  handle: 'mug',
  title: '  Mug ',
  descriptionHtml: '<p>Hi</p><script>alert(1)</script>',
  tags: [' kitchen', 'kitchen', ''],
  status: ProductStatus.DRAFT,
  optionNames: [' Color '],
  variants: [
    {
      sku: '  ',
      optionValues: [' Oat '],
      price: '1.00',
      requiresShipping: true,
      taxable: true,
      outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
      inventory: { tracked: true, quantity: 0 },
    },
  ],
  media: [],
};

describe('normalizeDraft', () => {
  it('trims text, drops empty values and sanitizes the description', () => {
    const normalized = normalizeDraft(DRAFT);

    expect(normalized.title).toBe('Mug');
    expect(normalized.descriptionHtml).toBe('<p>Hi</p>');
    expect(normalized.tags).toEqual(['kitchen']);
    expect(normalized.optionNames).toEqual(['Color']);
    expect(normalized.variants[0]).toMatchObject({ sku: undefined, optionValues: ['Oat'] });
  });
});
