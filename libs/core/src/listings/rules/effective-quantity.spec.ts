import { effectiveQuantity } from './effective-quantity.js';

describe('effectiveQuantity', () => {
  it.each([
    [10, null, 10],
    [10, { inventoryBuffer: 3, maxQuantity: null }, 7],
    [2, { inventoryBuffer: 3, maxQuantity: null }, 0],
    [100, { inventoryBuffer: null, maxQuantity: 20 }, 20],
    [25, { inventoryBuffer: 10, maxQuantity: 20 }, 15],
    [-4, null, 0],
    [5, { inventoryBuffer: 0, maxQuantity: 0 }, 0],
  ])('shows %i available with %j as %i', (available, limits, expected) => {
    expect(effectiveQuantity(available, limits)).toBe(expected);
  });
});
