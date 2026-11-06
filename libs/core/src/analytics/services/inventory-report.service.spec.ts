import type { WorkspaceSettingsRepository } from '../../workspace-settings/workspace-settings.repository.js';
import { ChannelConnectionStatus, ListingStatus, Prisma } from '@crossmart/database';
import { StockLevel } from '../../inventory/enums/stock-level.enum.js';
import { LOW_STOCK_THRESHOLD } from '../../inventory/inventory.constants.js';
import type { InventoryReportRepository } from '../repositories/inventory-report.repository.js';
import { LOW_STOCK_VARIANTS_LIMIT } from '../analytics.constants.js';
import { InventoryReportService } from './inventory-report.service.js';

const LEVEL_COUNTS: Record<StockLevel, number> = {
  [StockLevel.InStock]: 12,
  [StockLevel.LowStock]: 3,
  [StockLevel.OutOfStock]: 2,
  [StockLevel.Untracked]: 1,
};

function setup() {
  const inventory = {
    value: vi.fn<InventoryReportRepository['value']>().mockResolvedValue({
      atCost: new Prisma.Decimal('410.5'),
      atPrice: new Prisma.Decimal('1200'),
      unitsOnHand: 40,
      variantsWithoutCost: 2,
    }),
    stockLevelCount: vi
      .fn<InventoryReportRepository['stockLevelCount']>()
      .mockImplementation((_workspaceId, level) => Promise.resolve(LEVEL_COUNTS[level])),
    lowestStock: vi.fn<InventoryReportRepository['lowestStock']>().mockResolvedValue([
      {
        id: 'item-1',
        workspaceId: 'ws-1',
        variantId: 'v-1',
        tracked: true,
        available: -2,
        reserved: 3,
        updatedAt: new Date('2026-11-01T00:00:00Z'),
        variant: {
          productId: 'p-1',
          sku: 'MUG-BLUE',
          optionValues: ['Blue'],
          product: { title: 'Mug', media: [] },
        },
      },
    ]),
    stores: vi.fn<InventoryReportRepository['stores']>().mockResolvedValue([
      {
        id: 'c-1',
        channel: 'shopify',
        displayName: 'North',
        status: ChannelConnectionStatus.CONNECTED,
        lastSyncedAt: null,
      },
      {
        id: 'c-2',
        channel: 'shopify',
        displayName: 'South',
        status: ChannelConnectionStatus.NEEDS_REAUTH,
        lastSyncedAt: null,
      },
    ]),
    listingCounts: vi.fn<InventoryReportRepository['listingCounts']>().mockResolvedValue([
      { connectionId: 'c-1', status: ListingStatus.ACTIVE, count: 7 },
      { connectionId: 'c-1', status: ListingStatus.ERROR, count: 1 },
    ]),
  };
  const workspaces = {
    get: vi
      .fn<WorkspaceSettingsRepository['get']>()
      .mockResolvedValue({ currency: 'EUR', timeZone: null }),
  };
  const service = new InventoryReportService(
    inventory as unknown as InventoryReportRepository,
    workspaces as unknown as WorkspaceSettingsRepository,
  );
  return { service, inventory };
}

describe('InventoryReportService', () => {
  it('values stock at cost and at price in the workspace currency', async () => {
    const report = await setup().service.report('ws-1');
    expect(report.currencyCode).toBe('EUR');
    expect(report.value).toEqual({
      atCost: '410.50',
      atPrice: '1200.00',
      unitsOnHand: 40,
      variantsWithoutCost: 2,
    });
  });

  it('counts variants at each stock level', async () => {
    const report = await setup().service.report('ws-1');
    expect(report.stockLevels).toEqual({ inStock: 12, lowStock: 3, outOfStock: 2, untracked: 1 });
    expect(report.lowStockThreshold).toBe(LOW_STOCK_THRESHOLD);
  });

  it('lists the variants lowest on stock, oversold ones as out of stock', async () => {
    const { service, inventory } = setup();
    const report = await service.report('ws-1');
    expect(inventory.lowestStock).toHaveBeenCalledWith('ws-1', LOW_STOCK_VARIANTS_LIMIT);
    expect(report.lowestStock).toEqual([
      expect.objectContaining({
        variantId: 'v-1',
        productTitle: 'Mug',
        available: -2,
        onHand: 1,
        stockLevel: StockLevel.OutOfStock,
      }),
    ]);
  });

  it('gives every store every listing status, zero when it has none', async () => {
    const { stores } = await setup().service.report('ws-1');
    const counts = (index: number) =>
      Object.fromEntries(stores[index].listings.map((entry) => [entry.status, entry.count]));
    expect(counts(0)).toMatchObject({ [ListingStatus.ACTIVE]: 7, [ListingStatus.ERROR]: 1 });
    expect(stores[0].listings).toHaveLength(Object.values(ListingStatus).length);
    expect(Object.values(counts(1)).every((count) => count === 0)).toBe(true);
    expect(stores[1].status).toBe(ChannelConnectionStatus.NEEDS_REAUTH);
  });
});
