import { InventoryMovementReason } from '@crossmart/database';
import { describeStockChange } from './stock-change-detail.js';

describe('describeStockChange', () => {
  it('names the variant by SKU, signs the change and gives the reason', () => {
    expect(
      describeStockChange({
        sku: 'MUG-BLUE',
        optionValues: ['Blue'],
        delta: 5,
        reason: InventoryMovementReason.RECEIVED,
      }),
    ).toBe('MUG-BLUE +5, received');
  });

  it('falls back to the option values, then to the change alone', () => {
    const removed = { sku: null, delta: -2, reason: InventoryMovementReason.DAMAGED };
    expect(describeStockChange({ ...removed, optionValues: ['Blue', 'Large'] })).toBe(
      'Blue / Large -2, damaged',
    );
    expect(describeStockChange({ ...removed, optionValues: [] })).toBe('-2, damaged');
  });
});
