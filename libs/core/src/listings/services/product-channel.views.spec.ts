import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import type { PricingContext } from '../entities/price-resolution.js';
import { ListingDisplayState } from '../enums/listing-display-state.enum.js';
import { PriceSource } from '../enums/price-source.enum.js';
import {
  connectionView,
  listingRecord,
  productDetail,
  variantPriceOverride,
  WORKSPACE_ID,
} from '../testing/listing.fixtures.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';
import type { ListingDisplayResolver } from './listing-display.resolver.js';
import type { PricingContextFactory } from './pricing-context.factory.js';
import { ProductChannelViews } from './product-channel.views.js';
import type { ProductSelectionService } from './product-selection.service.js';

/** +10%: the catalog's 89.00 becomes 97.90 on the store. */
const RULE: PricingRule = {
  adjustmentPercent: '10',
  fixedAmount: '0',
  rounding: PriceRounding.None,
  floor: null,
  compareAt: CompareAtMode.Adjust,
};

function setup() {
  const pricing: PricingContext = { rule: RULE, currencyCode: 'USD' };
  const pricingContexts = {
    build: vi.fn<PricingContextFactory['build']>().mockResolvedValue(pricing),
  };
  const selection = {
    includes: vi.fn<ProductSelectionService['includes']>().mockResolvedValue(true),
  };
  const displays = {
    resolve: vi.fn<ListingDisplayResolver['resolve']>().mockReturnValue({
      state: ListingDisplayState.Ready,
      reason: null,
      requirement: null,
    }),
  };
  return new ProductChannelViews(
    new ChannelPriceResolver(),
    selection as unknown as ProductSelectionService,
    pricingContexts as unknown as PricingContextFactory,
    displays as unknown as ListingDisplayResolver,
  );
}

describe('ProductChannelViews', () => {
  it('gives the rule’s price as the effective one when the listing fixes none', async () => {
    const view = await setup().build(WORKSPACE_ID, productDetail(), connectionView(), null);

    expect(view.variants[0]).toMatchObject({
      price: { price: '97.90', source: PriceSource.Rule },
      rulePrice: '97.90',
    });
  });

  it('keeps the rule’s price beside a fixed price, so the editor can show both', async () => {
    const listing = listingRecord({ variantOverrides: [variantPriceOverride('79.00')] });

    const view = await setup().build(WORKSPACE_ID, productDetail(), connectionView(), listing);

    expect(view.variants[0]).toMatchObject({
      price: { price: '79.00', source: PriceSource.Override },
      rulePrice: '97.90',
    });
  });
});
