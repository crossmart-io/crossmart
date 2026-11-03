import { ListingStatus, OutOfStockPolicy, ProductStatus } from '@crossmart/database';
import { MAX_STOCK_QUANTITY } from '../../../inventory/inventory.constants.js';
import { externalProduct, externalVariant } from '../testing/external-product.factory.js';
import { toImportedStock, toListingStatus, toProductDraft } from './external-product.mapper.js';

describe('external product mapping', () => {
  it('turns a channel product into a draft without stock, with its images', () => {
    const product = externalProduct('tote', ['TOTE-S', 'TOTE-L']);
    product.variants[1] = {
      ...product.variants[1]!,
      compareAtPrice: '12.00',
      weightGrams: 300,
      continueSellingWhenOutOfStock: true,
    };

    const draft = toProductDraft(product);

    expect(draft).toMatchObject({
      handle: 'tote',
      status: ProductStatus.ACTIVE,
      optionNames: ['Size'],
      vendor: 'Northfield Goods',
      productType: undefined,
      media: [{ url: 'https://cdn.shopify.com/tote.jpg', altText: undefined }],
    });
    expect(draft.variants[1]).toMatchObject({
      sku: 'TOTE-L',
      compareAtPrice: '12.00',
      weightGrams: 300,
      outOfStockPolicy: OutOfStockPolicy.CONTINUE_SELLING,
      inventory: { tracked: true, quantity: 0 },
    });
    expect(draft.variants[0]?.outOfStockPolicy).toBe(OutOfStockPolicy.STOP_SELLING);
  });

  it('keeps products that are not for sale as drafts and inactive listings', () => {
    const product = externalProduct('draft', [null], { active: false });

    expect(toProductDraft(product).status).toBe(ProductStatus.DRAFT);
    expect(toListingStatus(product)).toBe(ListingStatus.INACTIVE);
    expect(toListingStatus(externalProduct('live'))).toBe(ListingStatus.ACTIVE);
  });

  it.each([
    [externalVariant('tracked', { available: 7 }), 7],
    [externalVariant('oversold', { available: -3 }), 0],
    [externalVariant('huge', { available: MAX_STOCK_QUANTITY + 1 }), MAX_STOCK_QUANTITY],
    [externalVariant('untracked', { tracked: false, available: 4 }), null],
    [externalVariant('unknown', { available: null }), null],
  ])('reads the stock a variant brings (%#)', (variant, expected) => {
    expect(toImportedStock(variant)).toBe(expected);
  });
});
