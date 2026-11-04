import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';

export const VARIANT_S = '11111111-1111-4111-8111-111111111111';
export const VARIANT_M = '22222222-2222-4222-8222-222222222222';

const SHIRT_PRODUCT: ListingDraft['product'] = {
  handle: 'linen-shirt',
  title: 'Linen shirt',
  descriptionHtml: '<p>Breathable.</p>',
  vendor: 'Acme',
  productType: 'Shirts',
  tags: ['summer', 'linen'],
  active: true,
  optionNames: ['Size'],
  images: [{ url: 'https://cdn.example.com/shirt.jpg', altText: 'A linen shirt' }],
};

const SHIRT_VARIANTS: ListingDraft['variants'] = [
  {
    variantId: VARIANT_S,
    sku: 'SHIRT-S',
    barcode: '4006381333931',
    optionValues: ['S'],
    price: '102.99',
    compareAtPrice: null,
    available: 7,
    unitCost: '40.00',
    tracked: true,
    weightGrams: 250,
    requiresShipping: true,
    taxable: true,
    continueSellingWhenOutOfStock: false,
  },
  {
    variantId: VARIANT_M,
    sku: 'SHIRT-M',
    barcode: null,
    optionValues: ['M'],
    price: '102.99',
    compareAtPrice: '129.99',
    available: 0,
    unitCost: null,
    tracked: true,
    weightGrams: null,
    requiresShipping: true,
    taxable: true,
    continueSellingWhenOutOfStock: true,
  },
];

/** A two-variant draft whose productSet input is `__fixtures__/product-set-input.json`. */
export function shirtDraft(overrides: Partial<ListingDraft> = {}): ListingDraft {
  return {
    productId: '33333333-3333-4333-8333-333333333333',
    product: structuredClone(SHIRT_PRODUCT),
    variants: structuredClone(SHIRT_VARIANTS),
    ...overrides,
  };
}
