import { DEMO_SEED, SeededRandom } from './seeded-random.js';
import { StockAdjustmentModeValue, stockHistoryFor } from './stock-history.js';

function histories(onHand: number) {
  const random = new SeededRandom(DEMO_SEED);
  return Array.from({ length: 40 }, () => stockHistoryFor(onHand, random));
}

/** Replays a history the way the API applies it. */
function finalStock(onHand: number, history: ReturnType<typeof stockHistoryFor>): number[] {
  const stock = [onHand];
  for (const step of history) {
    const current = stock.at(-1)!;
    stock.push(
      step.mode === StockAdjustmentModeValue.Set ? step.quantity : current + step.quantity,
    );
  }
  return stock;
}

describe('demo stock history', () => {
  it('is the same on every run and gives only some variants a history', () => {
    expect(histories(3)).toEqual(histories(3));
    const withHistory = histories(3).filter((history) => history.length > 0);
    expect(withHistory.length).toBeGreaterThan(0);
    expect(withHistory.length).toBeLessThan(40);
  });

  it('never takes stock on hand below zero', () => {
    for (const history of histories(0)) {
      expect(Math.min(...finalStock(0, history))).toBeGreaterThanOrEqual(0);
    }
  });
});
