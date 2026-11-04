import { ChannelConnectionStatus, ListingStatus, Prisma } from '@crossmart/database';
import { StockLevel } from '../../inventory/enums/stock-level.enum.js';
import { LOW_STOCK_THRESHOLD } from '../../inventory/inventory.constants.js';
import type { InventoryReportRepository } from '../repositories/inventory-report.repository.js';
import type { SalesRepository } from '../repositories/sales.repository.js';
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
  const sales = {
    workspaceCurrency: vi.fn<SalesRepository['workspaceCurrency']>().mockResolvedValue('EUR'),
  };
  const service = new InventoryReportService(
    inventory as unknown as InventoryReportRepository,
    sales as unknown as SalesRepository,
  );
  return { service };
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
