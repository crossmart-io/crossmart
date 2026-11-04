import { LOW_STOCK_THRESHOLD } from '../inventory.constants.js';
import { StockLevel } from '../enums/stock-level.enum.js';
import { toStockLevel } from './stock-level.js';

describe('toStockLevel', () => {
  it.each([
    [false, 0, StockLevel.Untracked],
    [true, -2, StockLevel.OutOfStock],
    [true, 0, StockLevel.OutOfStock],
    [true, 1, StockLevel.LowStock],
    [true, LOW_STOCK_THRESHOLD, StockLevel.LowStock],
    [true, LOW_STOCK_THRESHOLD + 1, StockLevel.InStock],
  ])('tracked=%s with %i available is %s', (tracked, available, level) => {
    expect(toStockLevel(tracked, available)).toBe(level);
  });
});
