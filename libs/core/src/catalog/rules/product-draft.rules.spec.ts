import { OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import type { ProductDraft, VariantDraft } from '../entities/product-draft.js';
import { ImportIssueCode } from '../enums/import-issue-code.enum.js';
import { findDraftProblems } from './product-draft.rules.js';

function variant(overrides: Partial<VariantDraft> = {}): VariantDraft {
  return {
    optionValues: [],
    price: '10.00',
    requiresShipping: true,
    taxable: true,
    outOfStockPolicy: OutOfStockPolicy.STOP_SELLING,
    inventory: { tracked: true, quantity: 0 },
    ...overrides,
  };
}

function draft(overrides: Partial<ProductDraft> = {}): ProductDraft {
  return {
    handle: 'mug',
    title: 'Mug',
    descriptionHtml: '',
    tags: [],
    status: ProductStatus.ACTIVE,
    optionNames: [],
    variants: [variant()],
    media: [],
    ...overrides,
  };
}

function codes(product: ProductDraft): ImportIssueCode[] {
  return findDraftProblems(product).map((problem) => problem.code);
}

describe('findDraftProblems', () => {
  it('accepts a simple product', () => {
    expect(findDraftProblems(draft())).toEqual([]);
  });

  it('needs at least one variant', () => {
    expect(codes(draft({ variants: [] }))).toEqual([ImportIssueCode.MissingValue]);
  });

  it('caps the number of options', () => {
    const optionNames = ['Size', 'Color', 'Material', 'Fit'];
    expect(codes(draft({ optionNames, variants: [] }))).toContain(ImportIssueCode.InvalidOptions);
  });

  it('rejects option names that differ only in case', () => {
    const product = draft({
      optionNames: ['Size', 'size'],
      variants: [variant({ optionValues: ['S', 'M'] })],
    });
    expect(codes(product)).toEqual([ImportIssueCode.InvalidOptions]);
  });

  it('needs one value per option on every variant', () => {
    const product = draft({ optionNames: ['Size'], variants: [variant()] });
    expect(codes(product)).toEqual([ImportIssueCode.InvalidOptions]);
  });

  it('rejects a SKU used twice in the same product', () => {
    const product = draft({
      optionNames: ['Size'],
      variants: [
        variant({ sku: 'A', optionValues: ['S'] }),
        variant({ sku: 'A', optionValues: ['M'] }),
      ],
    });
    expect(codes(product)).toEqual([ImportIssueCode.DuplicateSku]);
  });
});
