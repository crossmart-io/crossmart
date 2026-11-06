import { plainToInstance } from 'class-transformer';
import { ListingOverrideDto, ListingOverridePatchDto } from './listing-override.dto.js';

const VARIANT_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d';

describe('ListingOverridePatchDto', () => {
  it('sends only the fields the request names, with null kept to revert them', () => {
    const body = plainToInstance(ListingOverridePatchDto, { title: null, maxQuantity: 4 });

    expect(body.toPatch()).toEqual({ title: null, maxQuantity: 4 });
  });

  it('normalizes what it sends like a full save', () => {
    const body = plainToInstance(ListingOverridePatchDto, {
      title: '  ',
      tags: [' sale ', 'sale', ''],
      variantPrices: [{ variantId: VARIANT_ID, price: '10', compareAtPrice: null }],
    });

    expect(body.toPatch()).toEqual({
      title: null,
      tags: ['sale'],
      variantPrices: [{ variantId: VARIANT_ID, price: '10.00', compareAtPrice: null }],
    });
  });

  it('is an empty patch for an empty body', () => {
    expect(plainToInstance(ListingOverridePatchDto, {}).toPatch()).toEqual({});
  });
});

describe('ListingOverrideDto', () => {
  it('follows the product for every field a full save leaves out', () => {
    const input = plainToInstance(ListingOverrideDto, { title: 'Store mug' }).toInput();

    expect(input).toMatchObject({ title: 'Store mug', tags: null, mediaUrls: null });
    expect(input.variantPrices).toEqual([]);
  });
});
