import { OrderStatus } from '@crossmart/database';
import { lineStockChange, orderStatusOf } from './order-line-stock.js';

const NOTHING = { reserved: 0, fulfilled: 0 };

describe('lineStockChange', () => {
  it('reserves a new order’s units, taking them off sale', () => {
    expect(lineStockChange(NOTHING, { quantity: 3, fulfilledQuantity: 0 }, false)).toEqual({
      next: { reserved: 3, fulfilled: 0 },
      reservedDelta: 3,
      availableDelta: -3,
      shipped: 0,
    });
  });

  it('changes nothing when the same order comes again', () => {
    const change = lineStockChange(
      { reserved: 3, fulfilled: 0 },
      { quantity: 3, fulfilledQuantity: 0 },
      false,
    );
    expect(change).toMatchObject({ reservedDelta: 0, availableDelta: 0, shipped: 0 });
  });

  it('moves shipped units out of the reservation and the stock on hand', () => {
    expect(
      lineStockChange({ reserved: 3, fulfilled: 0 }, { quantity: 3, fulfilledQuantity: 2 }, false),
    ).toEqual({
      next: { reserved: 1, fulfilled: 2 },
      reservedDelta: -2,
      availableDelta: 0,
      shipped: 2,
    });
  });

  it('takes units shipped before Crossmart saw the order straight from sale', () => {
    expect(lineStockChange(NOTHING, { quantity: 2, fulfilledQuantity: 2 }, false)).toMatchObject({
      reservedDelta: 0,
      availableDelta: -2,
      shipped: 2,
    });
  });

  it('gives back what a cancelled or reduced order no longer holds, but not shipped units', () => {
    expect(
      lineStockChange({ reserved: 1, fulfilled: 2 }, { quantity: 3, fulfilledQuantity: 2 }, true),
    ).toEqual({
      next: { reserved: 0, fulfilled: 2 },
      reservedDelta: -1,
      availableDelta: 1,
      shipped: 0,
    });
    expect(
      lineStockChange({ reserved: 3, fulfilled: 0 }, { quantity: 1, fulfilledQuantity: 0 }, false),
    ).toMatchObject({ reservedDelta: -2, availableDelta: 2 });
  });
});

describe('orderStatusOf', () => {
  it('reads the status from what shipped', () => {
    const lines = [
      { quantity: 2, fulfilledQuantity: 0 },
      { quantity: 1, fulfilledQuantity: 1 },
    ];
    expect(orderStatusOf(false, [{ quantity: 2, fulfilledQuantity: 0 }])).toBe(OrderStatus.OPEN);
    expect(orderStatusOf(false, lines)).toBe(OrderStatus.PARTIALLY_FULFILLED);
    expect(orderStatusOf(false, [{ quantity: 1, fulfilledQuantity: 1 }])).toBe(
      OrderStatus.FULFILLED,
    );
    expect(orderStatusOf(true, lines)).toBe(OrderStatus.CANCELLED);
  });
});
