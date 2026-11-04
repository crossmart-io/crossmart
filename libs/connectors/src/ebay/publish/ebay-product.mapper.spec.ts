import { EbayCondition } from '../listing/ebay-condition.enum.js';
import { mugDraft } from './ebay-listing.fixtures.js';
import { listingTitle, toInventoryItem } from './ebay-product.mapper.js';

describe('listingTitle', () => {
  it('cuts titles to 80 characters without splitting a character', () => {
    const title = `${'a'.repeat(79)}😀😀`;

    expect(Array.from(listingTitle(title))).toHaveLength(80);
    expect(listingTitle(title).endsWith('😀')).toBe(true);
    expect(listingTitle('  Mug  ')).toBe('Mug');
  });
});

describe('toInventoryItem', () => {
  it('sends a fixed quantity for untracked variants and never a negative one', () => {
    const draft = mugDraft();
    const [variant] = draft.variants;

    expect(
      toInventoryItem(draft, { ...variant, tracked: false, available: null }, EbayCondition.New)
        .availability.shipToLocationAvailability.quantity,
    ).toBe(1);
    expect(
      toInventoryItem(draft, { ...variant, available: -2 }, EbayCondition.UsedGood).availability
        .shipToLocationAvailability.quantity,
    ).toBe(0);
  });

  it('sends a 13-digit barcode as an EAN and ignores others', () => {
    const draft = mugDraft();
    const [variant] = draft.variants;

    expect(
      toInventoryItem(draft, { ...variant, barcode: '4006381333931' }, EbayCondition.New).product
        .ean,
    ).toEqual(['4006381333931']);
    expect(
      toInventoryItem(draft, { ...variant, barcode: 'ABC-1' }, EbayCondition.New).product,
    ).not.toHaveProperty('upc');
  });
});
