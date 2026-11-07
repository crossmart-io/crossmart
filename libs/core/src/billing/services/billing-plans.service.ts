import { BadRequestException, Injectable } from '@nestjs/common';
import { AppConfigService } from '@crossmart/common';
import type { BillingInterval } from '@crossmart/database';
import type { OfferedPlan } from '../../entitlements/entities/offered-plan.js';
import { PlanCatalogService } from '../../entitlements/services/plan-catalog.service.js';
import { PLAN_NOT_SELF_SERVE, PRICE_CACHE_TTL_MS, UNKNOWN_PLAN } from '../billing.constants.js';
import type { BillingPlanCatalog } from '../entities/billing-plan.js';
import type { ProviderPrice } from '../entities/provider-price.js';
import { BillingProvider } from '../providers/billing-provider.js';
import { planLookupKeys, toBillingPlan } from '../rules/billing-plan.js';
import { priceLookupKey } from '../rules/price-lookup-key.js';

interface CachedPrices {
  prices: ReadonlyMap<string, ProviderPrice>;
  expiresAt: number;
}

/**
 * The plan lineup with prices (ADR 0024). What each plan grants comes from the plan data; what it
 * costs comes from the billing provider, by lookup key, so no amount is written in code.
 */
@Injectable()
export class BillingPlansService {
  private cached: CachedPrices | null = null;

  constructor(
    private readonly planCatalog: PlanCatalogService,
    private readonly provider: BillingProvider,
    private readonly appConfig: AppConfigService,
  ) {}

  async catalog(): Promise<BillingPlanCatalog> {
    const offered = await this.planCatalog.listOffered();
    const prices = await this.pricesOf(offered);
    return {
      plans: offered.map((plan) => toBillingPlan(plan, prices)),
      salesEmail: this.appConfig.billingSettings.salesEmail,
    };
  }

  /** An offered plan's price for the interval; 400 when it is not offered or not sold online. */
  async priceFor(planCode: string, interval: BillingInterval): Promise<ProviderPrice> {
    const offered = await this.planCatalog.listOffered();
    if (!offered.some((plan) => plan.code === planCode)) {
      throw new BadRequestException(UNKNOWN_PLAN);
    }
    const price = (await this.pricesOf(offered)).get(priceLookupKey(planCode, interval));
    if (!price) throw new BadRequestException(PLAN_NOT_SELF_SERVE);
    return price;
  }

  /** Prices change rarely and pricing pages are read often, so they are kept for a while. */
  private async pricesOf(
    plans: readonly OfferedPlan[],
  ): Promise<ReadonlyMap<string, ProviderPrice>> {
    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) return this.cached.prices;
    const found = await this.provider.findPrices(planLookupKeys(plans));
    const prices = new Map(found.map((price) => [price.lookupKey, price]));
    this.cached = { prices, expiresAt: now + PRICE_CACHE_TTL_MS };
    return prices;
  }
}
