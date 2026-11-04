import { Injectable } from '@nestjs/common';
import { ListingStatus } from '@crossmart/database';
import { toAmount } from '../../catalog/mappers/decimal-amount.mapper.js';
import { StockLevel } from '../../inventory/enums/stock-level.enum.js';
import { LOW_STOCK_THRESHOLD } from '../../inventory/inventory.constants.js';
import type {
  InventoryReport,
  StockLevelCounts,
  StoreHealth,
} from '../entities/inventory-report.js';
import {
  InventoryReportRepository,
  type ListingCountRow,
  type StoreRecord,
} from '../repositories/inventory-report.repository.js';
import { SalesRepository } from '../repositories/sales.repository.js';

function toStoreHealth(stores: StoreRecord[], counts: ListingCountRow[]): StoreHealth[] {
  return stores.map((store) => {
    const own = counts.filter((row) => row.connectionId === store.id);
    const listings = Object.values(ListingStatus).map((status) => ({
      status,
      count: own.find((row) => row.status === status)?.count ?? 0,
    }));
    return {
      connectionId: store.id,
      channel: store.channel,
      displayName: store.displayName,
      status: store.status,
      lastSyncedAt: store.lastSyncedAt,
      listings,
    };
  });
}

/**
 * The overview's inventory report: stock value at cost and at price, how many variants are low
 * or out, and each store's listings by status. A snapshot of now, in the workspace currency.
 */
@Injectable()
export class InventoryReportService {
  constructor(
    private readonly inventory: InventoryReportRepository,
    private readonly sales: SalesRepository,
  ) {}

  async report(workspaceId: string): Promise<InventoryReport> {
    const [currencyCode, value, stockLevels, stores, listingCounts] = await Promise.all([
      this.sales.workspaceCurrency(workspaceId),
      this.inventory.value(workspaceId),
      this.stockLevels(workspaceId),
      this.inventory.stores(workspaceId),
      this.inventory.listingCounts(workspaceId),
    ]);
    return {
      currencyCode,
      value: {
        atCost: toAmount(value.atCost),
        atPrice: toAmount(value.atPrice),
        unitsOnHand: value.unitsOnHand,
        variantsWithoutCost: value.variantsWithoutCost,
      },
      stockLevels,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
      stores: toStoreHealth(stores, listingCounts),
    };
  }

  private async stockLevels(workspaceId: string): Promise<StockLevelCounts> {
    const [inStock, lowStock, outOfStock, untracked] = await Promise.all(
      [StockLevel.InStock, StockLevel.LowStock, StockLevel.OutOfStock, StockLevel.Untracked].map(
        (level) => this.inventory.stockLevelCount(workspaceId, level),
      ),
    );
    return {
      inStock: inStock ?? 0,
      lowStock: lowStock ?? 0,
      outOfStock: outOfStock ?? 0,
      untracked: untracked ?? 0,
    };
  }
}
