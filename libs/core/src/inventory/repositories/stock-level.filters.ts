import type { Prisma } from '@crossmart/database';
import { StockLevel } from '../enums/stock-level.enum.js';
import { LOW_STOCK_THRESHOLD } from '../inventory.constants.js';

/** The inventory items at each stock level. Mirrors `toStockLevel`. */
export const STOCK_LEVEL_FILTERS: Record<StockLevel, Prisma.InventoryItemWhereInput> = {
  [StockLevel.InStock]: { tracked: true, available: { gt: LOW_STOCK_THRESHOLD } },
  [StockLevel.LowStock]: { tracked: true, available: { gt: 0, lte: LOW_STOCK_THRESHOLD } },
  [StockLevel.OutOfStock]: { tracked: true, available: { lte: 0 } },
  [StockLevel.Untracked]: { tracked: false },
};
