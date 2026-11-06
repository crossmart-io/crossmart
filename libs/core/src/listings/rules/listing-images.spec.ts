import { effectiveImageUrls } from './listing-images.js';

const PRODUCT_URLS = ['https://cdn.example.com/1.jpg', 'https://cdn.example.com/2.jpg'];

describe('effectiveImageUrls', () => {
  it('follows the product without an image override', () => {
    expect(effectiveImageUrls(PRODUCT_URLS, null)).toEqual(PRODUCT_URLS);
    expect(effectiveImageUrls(PRODUCT_URLS, { mediaOverridden: false, mediaUrls: [] })).toEqual(
      PRODUCT_URLS,
    );
  });

  it('shows the chosen subset in its order, without images the product dropped', () => {
    const override = {
      mediaOverridden: true,
      mediaUrls: ['https://cdn.example.com/2.jpg', 'https://cdn.example.com/gone.jpg'],
    };

    expect(effectiveImageUrls(PRODUCT_URLS, override)).toEqual(['https://cdn.example.com/2.jpg']);
  });

  it('shows none when the override chose none', () => {
    expect(effectiveImageUrls(PRODUCT_URLS, { mediaOverridden: true, mediaUrls: [] })).toEqual([]);
  });
});
