import { HttpStatus } from '@nestjs/common';
import type { AppConfigService } from '@crossmart/common';
import { BillingInterval } from '@crossmart/database';
import type { OfferedPlan } from '../../entitlements/entities/offered-plan.js';
import type { PlanCatalogService } from '../../entitlements/services/plan-catalog.service.js';
import { FakeBillingProvider, fakePrice } from '../testing/fake-billing-provider.js';
import { BillingPlansService } from './billing-plans.service.js';

const OFFERED: OfferedPlan[] = [
  { code: 'starter', name: 'Starter', version: 2, grants: new Map() },
  { code: 'enterprise', name: 'Enterprise', version: 1, grants: new Map() },
];

function setup() {
  const provider = new FakeBillingProvider();
  provider.prices.push(
    fakePrice('starter', BillingInterval.MONTHLY, 2900),
    fakePrice('starter', BillingInterval.ANNUAL, 27600),
  );
  const findPrices = vi.spyOn(provider, 'findPrices');
  const planCatalog = {
    listOffered: vi.fn<PlanCatalogService['listOffered']>().mockResolvedValue(OFFERED),
  };
  const appConfig = {
    billingSettings: { salesEmail: 'hello@crossmart.io' },
  } as unknown as AppConfigService;
  const service = new BillingPlansService(
    planCatalog as unknown as PlanCatalogService,
    provider,
    appConfig,
  );
  return { service, findPrices };
}

describe('BillingPlansService', () => {
  it('prices the offered plans from the provider, and sends the rest to sales', async () => {
    const { service, findPrices } = setup();

    const catalog = await service.catalog();

    expect(findPrices).toHaveBeenCalledWith([
      'crossmart_starter_monthly',
      'crossmart_starter_annual',
      'crossmart_enterprise_monthly',
      'crossmart_enterprise_annual',
    ]);
    expect(catalog.salesEmail).toBe('hello@crossmart.io');
    expect(
      catalog.plans.map(({ code, selfServe, prices }) => ({ code, selfServe, prices })),
    ).toEqual([
      {
        code: 'starter',
        selfServe: true,
        prices: [
          { interval: BillingInterval.MONTHLY, amount: 2900, monthlyAmount: 2900, currency: 'usd' },
          { interval: BillingInterval.ANNUAL, amount: 27600, monthlyAmount: 2300, currency: 'usd' },
        ],
      },
      { code: 'enterprise', selfServe: false, prices: [] },
    ]);
  });

  it('reads prices from the provider once in a while, not on every page view', async () => {
    const { service, findPrices } = setup();

    await service.catalog();
    await service.catalog();
    await service.priceFor('starter', BillingInterval.ANNUAL);

    expect(findPrices).toHaveBeenCalledTimes(1);
  });

  it('gives the price checkout needs, and refuses plans that are not sold online', async () => {
    const { service } = setup();

    await expect(service.priceFor('starter', BillingInterval.MONTHLY)).resolves.toMatchObject({
      id: 'price_starter_monthly',
    });
    await expect(service.priceFor('enterprise', BillingInterval.MONTHLY)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
    await expect(service.priceFor('agency', BillingInterval.MONTHLY)).rejects.toMatchObject({
      status: HttpStatus.BAD_REQUEST,
    });
  });
});
