import { derivedSku, formatInventoryId, parseInventoryId } from './etsy-keys.js';
import { normalizeEtsyShopName, isEtsyShopId } from '../etsy-shop-id.js';

describe('Etsy keys', () => {
  it('derives a 32-character SKU from a variant id', () => {
    expect(derivedSku('22222222-2222-4222-8222-222222222222')).toBe(
      'CM222222222222422282222222222222',
    );
  });

  it('round-trips inventory ids, whose SKUs may hold the separator', () => {
    const ref = { listingId: '1801234567', sku: 'MUG:S' };

    expect(parseInventoryId(formatInventoryId(ref))).toEqual(ref);
    expect(parseInventoryId('MUG-S')).toBeNull();
    expect(parseInventoryId(':MUG-S')).toBeNull();
    expect(parseInventoryId('abc:MUG-S')).toBeNull();
    expect(parseInventoryId('1801234567:')).toBeNull();
  });

  it('accepts shop ids and shop names Etsy issues', () => {
    expect(isEtsyShopId('87654321')).toBe(true);
    expect(isEtsyShopId('0123')).toBe(false);
    expect(normalizeEtsyShopName('ClayAndKiln')).toBe('clayandkiln');
    expect(normalizeEtsyShopName('Clay_Kiln')).toBeNull();
  });
});
