import { BillingInterval } from '@crossmart/database';
import { parsePriceLookupKey, priceLookupKey } from './price-lookup-key.js';

describe('price lookup keys', () => {
  it('names a plan price by plan code and interval', () => {
    expect(priceLookupKey('starter', BillingInterval.MONTHLY)).toBe('crossmart_starter_monthly');
    expect(priceLookupKey('scale', BillingInterval.ANNUAL)).toBe('crossmart_scale_annual');
  });

  it('reads the plan and interval back, whatever the plan code holds', () => {
    expect(parsePriceLookupKey('crossmart_growth_annual')).toEqual({
      planCode: 'growth',
      interval: BillingInterval.ANNUAL,
    });
    expect(parsePriceLookupKey('crossmart_big_team_monthly')).toEqual({
      planCode: 'big_team',
      interval: BillingInterval.MONTHLY,
    });
  });

  it.each(['price_123', 'crossmart_starter', 'crossmart_starter_weekly', 'other_starter_monthly'])(
    'reads no plan price from %s',
    (key) => {
      expect(parsePriceLookupKey(key)).toBeNull();
    },
  );
});
