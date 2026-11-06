import { WorkspaceSettingsRepository } from '../../workspace-settings/workspace-settings.repository.js';
import { Injectable } from '@nestjs/common';
import { ListingStatus } from '@crossmart/database';
import { toAmount } from '../../catalog/mappers/decimal-amount.mapper.js';
import { StockLevel } from '../../inventory/enums/stock-level.enum.js';
import { LOW_STOCK_THRESHOLD } from '../../inventory/inventory.constants.js';
import { toInventoryRow } from '../../inventory/mappers/inventory-view.mapper.js';
import { LOW_STOCK_VARIANTS_LIMIT } from '../analytics.constants.js';
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
 * or out and which run lowest, and each store's listings by status. A snapshot of now, in the workspace currency.
 */
@Injectable()
export class InventoryReportService {
  constructor(
    private readonly inventory: InventoryReportRepository,
    private readonly workspaces: WorkspaceSettingsRepository,
  ) {}

  async report(workspaceId: string): Promise<InventoryReport> {
    const [currencyCode, value, stockLevels, lowestStock, stores, listingCounts] =
      await Promise.all([
        this.workspaces.get(workspaceId).then((settings) => settings.currency),
        this.inventory.value(workspaceId),
        this.stockLevels(workspaceId),
        this.inventory.lowestStock(workspaceId, LOW_STOCK_VARIANTS_LIMIT),
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
      lowestStock: lowestStock.map(toInventoryRow),
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
