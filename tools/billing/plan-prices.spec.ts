import { BillingInterval } from '@crossmart/database';
import { PLAN_PRICES_FILE } from './billing-sync.constants.js';
import { readPlanPrices } from './plan-prices.js';

const MONTHS_PER_YEAR = 12;

describe('plan-prices.json', () => {
  it('prices every self-serve plan monthly and annually, with annual billing cheaper', async () => {
    const config = await readPlanPrices(PLAN_PRICES_FILE);

    expect(config.currency).toBe('usd');
    expect(Object.keys(config.plans)).not.toContain('enterprise');
    for (const amounts of Object.values(config.plans)) {
      const monthly = amounts[BillingInterval.MONTHLY] ?? 0;
      const annual = amounts[BillingInterval.ANNUAL] ?? 0;
      expect(monthly).toBeGreaterThan(0);
      expect(annual).toBeGreaterThan(0);
      expect(annual).toBeLessThan(monthly * MONTHS_PER_YEAR);
      expect(annual % MONTHS_PER_YEAR).toBe(0);
    }
  });
});
