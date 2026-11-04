import { LOW_STOCK_THRESHOLD } from '../inventory.constants.js';
import { StockLevel } from '../enums/stock-level.enum.js';

export function toStockLevel(tracked: boolean, available: number): StockLevel {
  if (!tracked) return StockLevel.Untracked;
  if (available <= 0) return StockLevel.OutOfStock;
  return available <= LOW_STOCK_THRESHOLD ? StockLevel.LowStock : StockLevel.InStock;
}
