import {
  inputChanges,
  LISTING_PREVIEW_SOURCE,
  listingChanges,
  productChanges,
} from './action-preview.js';

const LISTING = LISTING_PREVIEW_SOURCE.parse({
  connection: { displayName: 'Outlet' },
  title: { product: 'Linen Shirt', effective: 'Linen Shirt – Outlet' },
  descriptionHtml: { product: '<p>Soft</p>', effective: '<p>Soft</p>' },
  vendor: { product: 'Acme', effective: 'Acme' },
  tags: { product: ['linen'], effective: ['linen'] },
  images: { product: [], effective: [] },
  visibility: { product: 'VISIBLE', effective: 'VISIBLE' },
  stock: { inventoryBuffer: null, maxQuantity: null },
  variants: [
    {
      variantId: 'v1',
      title: 'M',
      price: { product: '40.00', effective: '42.00' },
      compareAtPrice: { product: null, effective: null },
      rulePrice: '42.00',
    },
  ],
});

describe('action previews', () => {
  it('shows what a listing update changes, and a revert as the product’s value', () => {
    expect(
      listingChanges(LISTING, {
        title: null,
        vendor: 'Acme',
        variantPrices: [{ variantId: 'v1', price: '35.00', compareAtPrice: null }],
      }),
    ).toEqual([
      { field: 'title', before: 'Linen Shirt – Outlet', after: 'Linen Shirt' },
      { field: 'price (M)', before: '42.00', after: '35.00' },
    ]);
  });

  it('shows the product fields and variant prices a replace changes', () => {
    const product = {
      title: 'Mug',
      descriptionHtml: '',
      vendor: null,
      productType: null,
      tags: [],
      status: 'ACTIVE',
      variants: [{ id: 'v1', sku: 'MUG-1', price: '20.00' }],
    };
    expect(
      productChanges(product, { title: 'Big Mug', variants: [{ id: 'v1', price: '22.00' }] }),
    ).toEqual([
      { field: 'title', before: 'Mug', after: 'Big Mug' },
      { field: 'price (MUG-1)', before: '20.00', after: '22.00' },
    ]);
  });

  it('falls back to the values a call sets, leaving ids out', () => {
    expect(inputChanges({ productId: 'p', quantity: 3, mode: 'delta' })).toEqual([
      { field: 'quantity', before: null, after: '3' },
      { field: 'mode', before: null, after: 'delta' },
    ]);
  });
});
