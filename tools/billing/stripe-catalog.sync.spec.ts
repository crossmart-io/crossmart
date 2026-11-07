import { BillingInterval } from '@crossmart/database';
import { FakeStripeFetch } from '@crossmart/core/billing/testing/fake-stripe.js';
import type { PlanPricesConfig } from './plan-prices.js';
import { StripeCatalogSync } from './stripe-catalog.sync.js';

const STARTER = { code: 'starter', name: 'Starter' };
const ENTERPRISE = { code: 'enterprise', name: 'Enterprise' };
const CONFIG: PlanPricesConfig = {
  currency: 'usd',
  plans: { starter: { [BillingInterval.MONTHLY]: 2900, [BillingInterval.ANNUAL]: 27600 } },
};
const MISSING = {
  error: { type: 'invalid_request_error', code: 'resource_missing', message: 'No such product' },
};
const PRODUCT = {
  id: 'crossmart_plan_starter',
  object: 'product',
  name: 'Crossmart Starter',
  active: true,
};
const EMPTY_LIST = { object: 'list', data: [], has_more: false };

function price(id: string, amount: number, interval: 'month' | 'year') {
  return {
    id,
    object: 'price',
    unit_amount: amount,
    currency: 'usd',
    recurring: { interval },
    product: 'crossmart_plan_starter',
    lookup_key: interval === 'month' ? 'crossmart_starter_monthly' : 'crossmart_starter_annual',
  };
}

function list(...data: unknown[]) {
  return { object: 'list', data, has_more: false };
}

function setup() {
  const stripe = new FakeStripeFetch();
  const lines: string[] = [];
  const sync = new StripeCatalogSync(stripe.client(), (line) => lines.push(line));
  return { stripe, sync, lines };
}

const paths = (stripe: FakeStripeFetch) =>
  stripe.requests.map((request) => `${request.method} ${request.path}`);

describe('StripeCatalogSync', () => {
  it('creates the products, prices and portal of a fresh account, skipping Enterprise', async () => {
    const { stripe, sync, lines } = setup();
    stripe
      .replyJson(MISSING, 404)
      .replyJson(PRODUCT)
      .replyJson(EMPTY_LIST)
      .replyJson(price('price_monthly', 2900, 'month'))
      .replyJson(EMPTY_LIST)
      .replyJson(price('price_annual', 27600, 'year'))
      .replyJson(EMPTY_LIST)
      .replyJson({ id: 'bpc_new', object: 'billing_portal.configuration' });

    const portalId = await sync.sync([STARTER, ENTERPRISE], CONFIG);

    expect(portalId).toBe('bpc_new');
    expect(paths(stripe)).toEqual([
      'GET /v1/products/crossmart_plan_starter',
      'POST /v1/products',
      'GET /v1/prices',
      'POST /v1/prices',
      'GET /v1/prices',
      'POST /v1/prices',
      'GET /v1/billing_portal/configurations',
      'POST /v1/billing_portal/configurations',
    ]);
    const monthly = stripe.paramsOf(3);
    expect(monthly.get('lookup_key')).toBe('crossmart_starter_monthly');
    expect(monthly.get('unit_amount')).toBe('2900');
    expect(monthly.get('recurring[interval]')).toBe('month');
    expect(monthly.get('transfer_lookup_key')).toBe('true');
    expect(stripe.paramsOf(5).get('recurring[interval]')).toBe('year');
    const portal = stripe.paramsOf(7);
    expect(portal.get('features[subscription_update][products][0][product]')).toBe(
      'crossmart_plan_starter',
    );
    expect(portal.get('features[subscription_update][products][0][prices][1]')).toBe(
      'price_annual',
    );
    expect(portal.get('features[subscription_cancel][mode]')).toBe('at_period_end');
    expect(lines).toContain('Enterprise: not sold online (contact sales), skipped');
  });

  it('changes nothing when Stripe already sells the plans as configured', async () => {
    const { stripe, sync } = setup();
    stripe
      .replyJson(PRODUCT)
      .replyJson(list(price('price_monthly', 2900, 'month')))
      .replyJson(list(price('price_annual', 27600, 'year')))
      .replyJson(list({ id: 'bpc_managed', metadata: { crossmart_managed: 'true' } }))
      .replyJson({ id: 'bpc_managed', object: 'billing_portal.configuration' });

    const portalId = await sync.sync([STARTER], CONFIG);

    expect(portalId).toBe('bpc_managed');
    expect(paths(stripe)).toEqual([
      'GET /v1/products/crossmart_plan_starter',
      'GET /v1/prices',
      'GET /v1/prices',
      'GET /v1/billing_portal/configurations',
      'POST /v1/billing_portal/configurations/bpc_managed',
    ]);
  });

  it('moves the lookup key to a new price when an amount changes, and archives the old one', async () => {
    const { stripe, sync } = setup();
    stripe
      .replyJson(PRODUCT)
      .replyJson(list(price('price_old', 2500, 'month')))
      .replyJson(price('price_new', 2900, 'month'))
      .replyJson(price('price_old', 2500, 'month'))
      .replyJson(list(price('price_annual', 27600, 'year')))
      .replyJson(EMPTY_LIST)
      .replyJson({ id: 'bpc_new', object: 'billing_portal.configuration' });

    await sync.sync([STARTER], CONFIG);

    expect(paths(stripe).slice(1, 4)).toEqual([
      'GET /v1/prices',
      'POST /v1/prices',
      'POST /v1/prices/price_old',
    ]);
    expect(stripe.paramsOf(3).get('active')).toBe('false');
  });
});
