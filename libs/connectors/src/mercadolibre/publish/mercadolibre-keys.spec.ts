import { formatVariantKey, hasVariationKeys, parseVariantKey } from './mercadolibre-keys.js';

describe('Mercado Libre variant keys', () => {
  it('names an item, or a variation of one', () => {
    expect(formatVariantKey({ itemId: 'MLM123', variationId: null })).toBe('MLM123');
    expect(formatVariantKey({ itemId: 'MLM123', variationId: 456 })).toBe('MLM123:456');
    expect(parseVariantKey('MLM123:456')).toEqual({ itemId: 'MLM123', variationId: 456 });
    expect(parseVariantKey('MLC9')).toEqual({ itemId: 'MLC9', variationId: null });
  });

  it('refuses what is not a key', () => {
    for (const key of ['', 'SKU-1', 'MLM123:', 'MLM123:abc', 'MLM1:2:3', '12345']) {
      expect(parseVariantKey(key)).toBeNull();
    }
  });

  it('tells a listing published as variations', () => {
    expect(hasVariationKeys(['MLM1:2', null])).toBe(true);
    expect(hasVariationKeys(['MLM1', 'MLM2', undefined])).toBe(false);
  });
});
