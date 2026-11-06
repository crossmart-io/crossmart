import { toExternalOrder } from './ebay-order.mapper.js';
import { ebayOrderSchema, type EbayOrder } from './ebay-order.types.js';

const usd = (value: string) => ({ value, currency: 'USD' });

function order(overrides: Record<string, unknown> = {}): EbayOrder {
  return ebayOrderSchema.parse({
    orderId: '12-00000-00001',
    creationDate: '2026-11-05T10:00:00.000Z',
    lastModifiedDate: '2026-11-05T11:00:00.000Z',
    cancelStatus: { cancelState: 'NONE_REQUESTED' },
    pricingSummary: { total: usd('30.00') },
    lineItems: [
      {
        lineItemId: 'line-1',
        sku: 'MUG-1',
        title: 'Mug',
        quantity: 3,
        lineItemCost: usd('30.00'),
        listingMarketplaceId: 'EBAY_US',
        lineItemFulfillmentStatus: 'IN_PROGRESS',
      },
    ],
    ...overrides,
  });
}

describe('toExternalOrder', () => {
  it('keeps a line that is shipping but not yet fulfilled reserved', () => {
    expect(toExternalOrder(order(), 'EBAY_US')?.lines[0]).toMatchObject({
      quantity: 3,
      fulfilledQuantity: 0,
      unitPrice: '10.00',
    });
  });

  it('subtracts only final order-level refunds, ignoring line refunds then', () => {
    const refunded = order({
      paymentSummary: {
        refunds: [
          { amount: usd('5.00'), refundStatus: 'REFUNDED' },
          { amount: usd('7.00'), refundStatus: 'PENDING' },
        ],
      },
      lineItems: [
        {
          lineItemId: 'line-1',
          quantity: 1,
          lineItemCost: usd('30.00'),
          refunds: [{ amount: usd('5.00') }],
        },
      ],
    });

    expect(toExternalOrder(refunded, 'EBAY_US')?.total).toBe('25.00');
  });

  it('never goes below zero, and skips refunds in another currency', () => {
    const refunded = order({
      paymentSummary: {
        refunds: [
          { amount: usd('40.00'), refundStatus: 'REFUNDED' },
          { amount: { value: '9.00', currency: 'GBP' }, refundStatus: 'REFUNDED' },
        ],
      },
    });

    expect(toExternalOrder(refunded, 'EBAY_US')?.total).toBe('0.00');
  });

  it('keeps lines that name no marketplace, and drops another marketplace’s lines', () => {
    const mixed = order({
      lineItems: [
        {
          lineItemId: 'us',
          quantity: 1,
          lineItemCost: usd('1.00'),
          listingMarketplaceId: 'EBAY_US',
        },
        {
          lineItemId: 'gb',
          quantity: 1,
          lineItemCost: usd('1.00'),
          listingMarketplaceId: 'EBAY_GB',
        },
        { lineItemId: 'any', quantity: 1, lineItemCost: usd('1.00') },
      ],
    });

    const lines = toExternalOrder(mixed, 'EBAY_US')?.lines ?? [];

    expect(lines.map((line) => line.externalId)).toEqual(['us', 'any']);
  });

  it('answers null for an order sold only on another marketplace', () => {
    expect(toExternalOrder(order(), 'EBAY_DE')).toBeNull();
  });

  it('prices a line with no units at its cost', () => {
    const empty = order({
      lineItems: [{ lineItemId: 'line-1', quantity: 0, lineItemCost: usd('0.00') }],
    });

    expect(toExternalOrder(empty, 'EBAY_US')?.lines[0]?.unitPrice).toBe('0.00');
  });
});
