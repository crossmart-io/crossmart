import type { Redis } from 'ioredis';
import { RedisAskDailyBudget } from './redis-ask-daily-budget.js';

function budgetCounting(taken: number) {
  const evalScript = vi.fn().mockResolvedValue(taken);
  return { budget: new RedisAskDailyBudget({ eval: evalScript } as unknown as Redis), evalScript };
}

describe('RedisAskDailyBudget', () => {
  it('counts the question under the UTC date and allows it within the cap', async () => {
    const { budget, evalScript } = budgetCounting(3);

    expect(await budget.tryTake(3, new Date('2026-11-06T23:59:00Z'))).toBe(true);
    expect(evalScript).toHaveBeenCalledWith(
      expect.stringContaining('INCR'),
      1,
      'crossmart:ask:questions:2026-11-06',
      expect.any(Number),
    );
  });

  it('refuses past the cap', async () => {
    const { budget } = budgetCounting(4);

    expect(await budget.tryTake(3, new Date('2026-11-06T10:00:00Z'))).toBe(false);
  });
});
