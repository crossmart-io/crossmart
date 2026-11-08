import type { ListingDraft } from '../../sdk/capabilities/listing-publisher.js';
import { EBAY_MAX_IMAGES, EBAY_MAX_VARIATION_IMAGES } from '../ebay.constants.js';
import { EbayCondition } from '../listing/ebay-condition.enum.js';
import {
  galleryImages,
  galleryImageUrl,
  mugDraft,
  shirtDraft,
  VARIANT_M,
  VARIANT_S,
} from './ebay-listing.fixtures.js';
import { listingTitle, toInventoryItem, toInventoryItemGroup } from './ebay-product.mapper.js';

/** The first `count` gallery URLs, in the order the product lists them. */
const firstGalleryUrls = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => galleryImageUrl(index + 1));

/** The draft with 30 photos, more than any eBay inventory item takes. */
function withGallery(draft: ListingDraft): ListingDraft {
  return { ...draft, product: { ...draft.product, images: galleryImages() } };
}

describe('listingTitle', () => {
  it('cuts titles to 80 characters without splitting a character', () => {
    const title = `${'a'.repeat(79)}😀😀`;

    expect(Array.from(listingTitle(title))).toHaveLength(80);
    expect(listingTitle(title).endsWith('😀')).toBe(true);
    expect(listingTitle('  Mug  ')).toBe('Mug');
  });
});

describe('toInventoryItem', () => {
  it('sends the vendor as the brand, and Unbranded without one', () => {
    const draft = mugDraft();
    const [variant] = draft.variants;

    expect(toInventoryItem(draft, variant, EbayCondition.New).product.aspects).toEqual({
      Brand: ['Unbranded'],
    });
    draft.product.vendor = '  Acme ';
    expect(toInventoryItem(draft, variant, EbayCondition.New).product.aspects).toEqual({
      Brand: ['Acme'],
    });
  });

  it('lets the merchant’s item specifics replace the derived brand', () => {
    const draft = mugDraft({
      itemSpecifics: [
        { name: 'Brand', values: ['Potter & Co'] },
        { name: 'Material', values: ['Stoneware'] },
        { name: 'Features', values: ['Dishwasher Safe', 'Microwave Safe'] },
        { name: 'Empty', values: [] },
      ],
    });
    const [variant] = draft.variants;

    const { product } = toInventoryItem(draft, variant, EbayCondition.New);

    expect(product.aspects).toEqual({
      Brand: ['Potter & Co'],
      Material: ['Stoneware'],
      Features: ['Dishwasher Safe', 'Microwave Safe'],
    });
    expect(product.brand).toBe('Potter & Co');
  });

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

describe('image limits', () => {
  it('sends the first 24 images on a single-variation item', () => {
    const draft = withGallery(mugDraft());
    const [variant] = draft.variants;

    const { product } = toInventoryItem(draft, variant, EbayCondition.New);

    expect(product.imageUrls).toEqual(firstGalleryUrls(EBAY_MAX_IMAGES));
  });

  it('sends the first 12 images on each item of a variation group', () => {
    const draft = withGallery(shirtDraft());

    for (const variant of draft.variants) {
      const { product } = toInventoryItem(draft, variant, EbayCondition.New);

      expect(product.imageUrls).toEqual(firstGalleryUrls(EBAY_MAX_VARIATION_IMAGES));
    }
  });

  it('keeps up to 24 images on the variation group itself', () => {
    const draft = withGallery(shirtDraft());
    const skus = new Map([
      [VARIANT_S, 'SHIRT-S'],
      [VARIANT_M, 'SHIRT-M'],
    ]);

    expect(toInventoryItemGroup(draft, skus).imageUrls).toEqual(firstGalleryUrls(EBAY_MAX_IMAGES));
  });

  it('counts only https images toward the limit', () => {
    const draft = withGallery(shirtDraft());
    draft.product.images.unshift({ url: 'http://insecure.example.com/cover.jpg', altText: null });
    const [variant] = draft.variants;

    expect(toInventoryItem(draft, variant, EbayCondition.New).product.imageUrls).toEqual(
      firstGalleryUrls(EBAY_MAX_VARIATION_IMAGES),
    );
  });
});
