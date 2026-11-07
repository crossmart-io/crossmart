import Stripe from 'stripe';
import {
  BILLING_INTERVALS,
  PLAN_CODE_METADATA_KEY,
} from '@crossmart/core/billing/billing.constants.js';
import { priceLookupKey } from '@crossmart/core/billing/rules/price-lookup-key.js';
import { STRIPE_INTERVAL_NAMES } from '@crossmart/core/billing/providers/stripe/stripe.constants.js';
import type { BillingInterval } from '@crossmart/database';
import {
  MANAGED_METADATA_KEY,
  MANAGED_METADATA_VALUE,
  PORTAL_CONFIGURATIONS_PAGE_SIZE,
  PRODUCT_ID_PREFIX,
  PRODUCT_NAME_PREFIX,
  RESOURCE_MISSING,
} from './billing-sync.constants.js';
import type { PlanPricesConfig } from './plan-prices.js';

/** A plan as the sync names its product. */
export interface SyncPlan {
  code: string;
  name: string;
}

/** One price the sync wants at Stripe. */
interface WantedPrice {
  plan: SyncPlan;
  productId: string;
  interval: BillingInterval;
  amount: number;
  currency: string;
}

type PortalProduct =
  Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.Product;

/**
 * Makes Stripe sell the plans (ADR 0024), idempotently: a product per plan, a monthly and an
 * annual price per product found by lookup key, and a Customer Portal configuration that lets
 * customers switch between them. A changed amount gets a new price that takes over the lookup key;
 * the old one is archived, and subscriptions on it keep it.
 */
export class StripeCatalogSync {
  constructor(
    private readonly stripe: Stripe,
    private readonly report: (line: string) => void,
  ) {}

  /** Returns the portal configuration id, for `STRIPE_PORTAL_CONFIGURATION_ID`. */
  async sync(plans: readonly SyncPlan[], config: PlanPricesConfig): Promise<string> {
    const portalProducts: PortalProduct[] = [];
    for (const plan of plans) {
      const amounts = config.plans[plan.code];
      if (!amounts) {
        this.report(`${plan.name}: not sold online (contact sales), skipped`);
        continue;
      }
      const productId = await this.syncProduct(plan);
      const prices: string[] = [];
      for (const interval of BILLING_INTERVALS) {
        const amount = amounts[interval];
        if (amount === undefined) continue;
        const wanted = { plan, productId, interval, amount, currency: config.currency };
        prices.push(await this.syncPrice(wanted));
      }
      portalProducts.push({ product: productId, prices });
    }
    return this.syncPortal(portalProducts);
  }

  private async syncProduct(plan: SyncPlan): Promise<string> {
    const id = `${PRODUCT_ID_PREFIX}${plan.code}`;
    const name = `${PRODUCT_NAME_PREFIX}${plan.name}`;
    const existing = await this.findProduct(id);
    if (!existing) {
      await this.stripe.products.create({
        id,
        name,
        metadata: { [PLAN_CODE_METADATA_KEY]: plan.code },
      });
      this.report(`${plan.name}: created product ${id}`);
    } else if (existing.name !== name || !existing.active) {
      await this.stripe.products.update(id, { name, active: true });
      this.report(`${plan.name}: updated product ${id}`);
    }
    return id;
  }

  private async findProduct(id: string): Promise<Stripe.Product | null> {
    try {
      return await this.stripe.products.retrieve(id);
    } catch (error) {
      if (
        error instanceof Stripe.errors.StripeInvalidRequestError &&
        error.code === RESOURCE_MISSING
      ) {
        return null;
      }
      throw error;
    }
  }

  private async syncPrice(wanted: WantedPrice): Promise<string> {
    const lookupKey = priceLookupKey(wanted.plan.code, wanted.interval);
    const { data } = await this.stripe.prices.list({ lookup_keys: [lookupKey], active: true });
    const [existing] = data;
    if (existing && StripeCatalogSync.matches(existing, wanted)) return existing.id;
    const created = await this.stripe.prices.create({
      product: wanted.productId,
      currency: wanted.currency,
      unit_amount: wanted.amount,
      recurring: { interval: STRIPE_INTERVAL_NAMES[wanted.interval] },
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      metadata: { [PLAN_CODE_METADATA_KEY]: wanted.plan.code },
    });
    if (existing) await this.stripe.prices.update(existing.id, { active: false });
    this.report(
      `${wanted.plan.name}: ${lookupKey} is ${wanted.amount} ${wanted.currency} (${created.id})`,
    );
    return created.id;
  }

  private static matches(price: Stripe.Price, wanted: WantedPrice): boolean {
    return (
      price.unit_amount === wanted.amount &&
      price.currency === wanted.currency &&
      price.recurring?.interval === STRIPE_INTERVAL_NAMES[wanted.interval] &&
      price.product === wanted.productId
    );
  }

  private async syncPortal(products: PortalProduct[]): Promise<string> {
    const features = StripeCatalogSync.portalFeatures(products);
    const { data } = await this.stripe.billingPortal.configurations.list({
      active: true,
      limit: PORTAL_CONFIGURATIONS_PAGE_SIZE,
    });
    const managed = data.find(
      (configuration) => configuration.metadata?.[MANAGED_METADATA_KEY] === MANAGED_METADATA_VALUE,
    );
    if (managed) {
      await this.stripe.billingPortal.configurations.update(managed.id, { features });
      this.report(`Customer Portal: updated ${managed.id}`);
      return managed.id;
    }
    const created = await this.stripe.billingPortal.configurations.create({
      features,
      metadata: { [MANAGED_METADATA_KEY]: MANAGED_METADATA_VALUE },
    });
    this.report(`Customer Portal: created ${created.id}`);
    return created.id;
  }

  /** Switch plan or interval with prorations, cancel at period end, card, invoices, details. */
  private static portalFeatures(
    products: PortalProduct[],
  ): Stripe.BillingPortal.ConfigurationCreateParams.Features {
    return {
      customer_update: { enabled: true, allowed_updates: ['email', 'name', 'address', 'tax_id'] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price'],
        products,
        proration_behavior: 'create_prorations',
      },
    };
  }
}
