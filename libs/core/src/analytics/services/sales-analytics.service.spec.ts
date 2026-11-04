import { Prisma } from '@crossmart/database';
import { SALES_RANGE_SPECS } from '../analytics.constants.js';
import type { BucketRow, PeriodBounds } from '../entities/sales-scope.js';
import { SalesInterval } from '../enums/sales-interval.enum.js';
import { SalesRange } from '../enums/sales-range.enum.js';
import type { SalesRepository } from '../repositories/sales.repository.js';
import { SalesAnalyticsService } from './sales-analytics.service.js';

const WORKSPACE_ID = 'ws-1';
const TIME_ZONE = 'Asia/Jerusalem';
const BOUNDS: PeriodBounds = { from: new Date('2026-10-29'), to: new Date('2026-11-05') };

function row(idx: number, connectionId: string | null, sales: string, orders: number): BucketRow {
  return {
    idx,
    startsOn: `2026-11-0${idx + 1}`,
    connectionId,
    sales: new Prisma.Decimal(sales),
    orders,
  };
}

const CURRENT_ROWS = [
  row(0, 'store-a', '100.00', 2),
  row(0, 'store-b', '30.50', 1),
  row(1, null, '0', 0),
  row(2, 'store-a', '19.50', 1),
];
const PREVIOUS_ROWS = [row(0, 'store-a', '50.00', 1), row(1, null, '0', 0), row(2, null, '0', 0)];

function setup() {
  const repository = {
    workspaceCurrency: vi.fn<SalesRepository['workspaceCurrency']>().mockResolvedValue('USD'),
    periodBounds: vi.fn<SalesRepository['periodBounds']>().mockResolvedValue(BOUNDS),
    bucketRows: vi
      .fn<SalesRepository['bucketRows']>()
      .mockImplementation((_scope, offset) =>
        Promise.resolve(offset === 0 ? CURRENT_ROWS : PREVIOUS_ROWS),
      ),
    unitsSold: vi.fn<SalesRepository['unitsSold']>().mockResolvedValue(6),
    topProducts: vi
      .fn<SalesRepository['topProducts']>()
      .mockResolvedValue([
        { productId: 'p-1', title: 'Mug', units: 4, sales: new Prisma.Decimal('80') },
      ]),
    otherCurrencyOrders: vi.fn<SalesRepository['otherCurrencyOrders']>().mockResolvedValue(2),
    stores: vi.fn<SalesRepository['stores']>().mockResolvedValue([
      { id: 'store-a', channel: 'shopify', displayName: 'A' },
      { id: 'store-b', channel: 'shopify', displayName: 'B' },
      { id: 'store-c', channel: 'shopify', displayName: 'C' },
    ]),
  };
  const service = new SalesAnalyticsService(repository as unknown as SalesRepository);
  return { repository, service };
}

describe('SalesAnalyticsService', () => {
  it('totals the current period and the one before it', async () => {
    const { service } = setup();
    const report = await service.report(WORKSPACE_ID, {
      range: SalesRange.Last7Days,
      timeZone: TIME_ZONE,
    });
    expect(report.currencyCode).toBe('USD');
    expect(report.interval).toBe(SalesInterval.Day);
    expect(report.current).toEqual({
      sales: '150.00',
      orders: 4,
      units: 6,
      averageOrderValue: '37.50',
    });
    expect(report.previous.sales).toBe('50.00');
    expect(report.otherCurrencyOrders).toBe(2);
  });

  it('reads the previous period one whole period back', async () => {
    const { repository, service } = setup();
    await service.report(WORKSPACE_ID, { range: SalesRange.Last90Days, timeZone: TIME_ZONE });
    const offsets = repository.bucketRows.mock.calls.map(([, offset]) => offset);
    expect(offsets).toEqual([0, SALES_RANGE_SPECS[SalesRange.Last90Days].buckets]);
    expect(repository.bucketRows.mock.calls[0][0]).toMatchObject({
      currencyCode: 'USD',
      timeZone: TIME_ZONE,
    });
  });

  it('gives one bucket per period slot, with the matching previous bucket', async () => {
    const { service } = setup();
    const { buckets } = await service.report(WORKSPACE_ID, {
      range: SalesRange.Last7Days,
      timeZone: TIME_ZONE,
    });
    expect(buckets.map((bucket) => bucket.sales)).toEqual(['130.50', '0.00', '19.50']);
    expect(buckets[0].previousSales).toBe('50.00');
    expect(buckets[0].byConnection).toHaveLength(2);
    expect(buckets[1].byConnection).toEqual([]);
  });

  it('lists every store, zero for those without orders', async () => {
    const { service } = setup();
    const { stores } = await service.report(WORKSPACE_ID, {
      range: SalesRange.Last7Days,
      timeZone: TIME_ZONE,
    });
    expect(stores.map((store) => [store.connectionId, store.sales, store.orders])).toEqual([
      ['store-a', '119.50', 3],
      ['store-b', '30.50', 1],
      ['store-c', '0.00', 0],
    ]);
  });

  it('has no average order value without orders', async () => {
    const { repository, service } = setup();
    repository.bucketRows.mockResolvedValue([row(0, null, '0', 0)]);
    const report = await service.report(WORKSPACE_ID, {
      range: SalesRange.Last7Days,
      timeZone: TIME_ZONE,
    });
    expect(report.current.averageOrderValue).toBeNull();
    expect(report.topProducts[0].sales).toBe('80.00');
  });
});
