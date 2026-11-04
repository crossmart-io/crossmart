import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import type { VariantPricing } from '../entities/price-resolution.js';
import { ExchangeRateSource } from '../enums/exchange-rate-source.enum.js';
import { PriceSource } from '../enums/price-source.enum.js';
import { PriceStepKind } from '../enums/price-step-kind.enum.js';
import { PriceWarning } from '../enums/price-warning.enum.js';
import { ChannelPriceResolver } from './channel-price-resolver.js';

const resolver = new ChannelPriceResolver();
const USD = 'USD';

function rule(overrides: Partial<PricingRule> = {}): PricingRule {
  return {
    adjustmentPercent: '0',
    fixedAmount: '0',
    rounding: PriceRounding.None,
    floor: null,
    compareAt: CompareAtMode.Adjust,
    ...overrides,
  };
}

function variant(overrides: Partial<VariantPricing> = {}): VariantPricing {
  return { price: '89.00', compareAtPrice: null, cost: null, ...overrides };
}

describe('ChannelPriceResolver', () => {
  it('sends the base price unchanged when the connection has no rule', () => {
    const resolved = resolver.resolve(variant(), { rule: null, currencyCode: USD });

    expect(resolved).toMatchObject({
      price: '89.00',
      source: PriceSource.Base,
      explanation: 'base price = $89.00',
      warnings: [],
    });
  });

  it('applies the percent, then rounds up to .99, and explains each step', () => {
    const resolved = resolver.resolve(variant(), {
      rule: rule({ adjustmentPercent: '15', rounding: PriceRounding.Ending99 }),
      currencyCode: USD,
    });

    expect(resolved.price).toBe('102.99');
    expect(resolved.source).toBe(PriceSource.Rule);
    expect(resolved.explanation).toBe('$89.00 → +15% → .99 = $102.99');
    expect(resolved.steps.map((step) => [step.kind, step.amount])).toEqual([
      [PriceStepKind.Base, '89.00'],
      [PriceStepKind.Percent, '102.35'],
      [PriceStepKind.Rounding, '102.99'],
    ]);
  });

  it.each([
    [PriceRounding.None, '102.35'],
    [PriceRounding.Ending99, '102.99'],
    [PriceRounding.Ending95, '102.95'],
    [PriceRounding.Whole, '103.00'],
  ])('rounds %s to %s', (rounding, expected) => {
    expect(
      resolver.resolve(variant(), {
        rule: rule({ adjustmentPercent: '15', rounding }),
        currencyCode: USD,
      }).price,
    ).toBe(expected);
  });

  it('rounds an amount that already ends in .99 or past .95 correctly', () => {
    const context = (rounding: PriceRounding) => ({ rule: rule({ rounding }), currencyCode: USD });

    expect(
      resolver.resolve(variant({ price: '12.99' }), context(PriceRounding.Ending99)).price,
    ).toBe('12.99');
    expect(
      resolver.resolve(variant({ price: '12.97' }), context(PriceRounding.Ending95)).price,
    ).toBe('13.95');
    expect(resolver.resolve(variant({ price: '12.00' }), context(PriceRounding.Whole)).price).toBe(
      '12.00',
    );
  });

  it('adds a fixed amount after the percent, and never goes below zero', () => {
    const discounted = resolver.resolve(variant({ price: '10.00' }), {
      rule: rule({ adjustmentPercent: '-10', fixedAmount: '-2.50' }),
      currencyCode: USD,
    });
    const negative = resolver.resolve(variant({ price: '1.00' }), {
      rule: rule({ fixedAmount: '-5' }),
      currencyCode: USD,
    });

    expect(discounted.price).toBe('6.50');
    expect(discounted.explanation).toBe('$10.00 → -10% → -$2.50 = $6.50');
    expect(negative.price).toBe('0.00');
    expect(negative.warnings).toContain(PriceWarning.ClampedToZero);
  });

  it('raises the price to cost plus margin, rounded the rule’s way', () => {
    const resolved = resolver.resolve(variant({ price: '50.00', cost: '40.00' }), {
      rule: rule({
        adjustmentPercent: '-10',
        rounding: PriceRounding.Ending99,
        floor: { minMarginPercent: '30' },
      }),
      currencyCode: USD,
    });

    expect(resolved.price).toBe('52.99');
    expect(resolved.explanation).toBe(
      '$50.00 → -10% → .99 → floor $52.00 (cost $40.00 + 30%) = $52.99',
    );
  });

  it('leaves a price above the floor alone and rounds the floor up to the cent', () => {
    const above = resolver.resolve(variant({ price: '100.00', cost: '40.00' }), {
      rule: rule({ floor: { minMarginPercent: '30' } }),
      currencyCode: USD,
    });
    const fractional = resolver.resolve(variant({ price: '1.00', cost: '3.33' }), {
      rule: rule({ floor: { minMarginPercent: '33.3' } }),
      currencyCode: USD,
    });

    expect(above.price).toBe('100.00');
    expect(above.steps.some((step) => step.kind === PriceStepKind.Floor)).toBe(false);
    // 3.33 × 1.333 = 4.43889, rounded up to 4.44.
    expect(fractional.price).toBe('4.44');
  });

  it('skips the floor and warns when the variant has no cost', () => {
    const resolved = resolver.resolve(variant({ price: '10.00', cost: null }), {
      rule: rule({ adjustmentPercent: '-50', floor: { minMarginPercent: '30' } }),
      currencyCode: USD,
    });

    expect(resolved.price).toBe('5.00');
    expect(resolved.warnings).toEqual([PriceWarning.MissingCost]);
  });

  it('lets a manual price win over the rule, warning when it is below the floor', () => {
    const resolved = resolver.resolve(
      variant({ cost: '70.00' }),
      {
        rule: rule({ adjustmentPercent: '15', floor: { minMarginPercent: '20' } }),
        currencyCode: USD,
      },
      { price: '79.00', compareAtPrice: null },
    );

    expect(resolved).toMatchObject({
      price: '79.00',
      source: PriceSource.Override,
      explanation: 'manual price = $79.00',
      warnings: [PriceWarning.BelowFloor],
    });
  });

  describe('compare-at prices', () => {
    const sale = variant({ price: '80.00', compareAtPrice: '100.00' });
    const markup = (compareAt: CompareAtMode) => ({
      rule: rule({ adjustmentPercent: '10', rounding: PriceRounding.Ending99, compareAt }),
      currencyCode: USD,
    });

    it.each([
      [CompareAtMode.Adjust, '110.99'],
      [CompareAtMode.Keep, '100.00'],
      [CompareAtMode.Omit, null],
    ])('%s gives %s', (mode, expected) => {
      expect(resolver.resolve(sale, markup(mode)).compareAtPrice).toBe(expected);
    });

    it('uses a manual compare-at price, and drops one that is not above the price', () => {
      const manual = resolver.resolve(sale, markup(CompareAtMode.Omit), {
        price: null,
        compareAtPrice: '120.00',
      });
      const dropped = resolver.resolve(sale, markup(CompareAtMode.Keep), {
        price: '100.00',
        compareAtPrice: null,
      });

      expect(manual.compareAtPrice).toBe('120.00');
      expect(dropped.compareAtPrice).toBeNull();
      expect(dropped.warnings).toContain(PriceWarning.CompareAtDropped);
    });
  });

  describe('currency precision', () => {
    it('rounds zero-decimal currencies to whole amounts, even for charm endings', () => {
      const resolved = resolver.resolve(variant({ price: '1000' }), {
        rule: rule({ adjustmentPercent: '15', rounding: PriceRounding.Ending99 }),
        currencyCode: 'JPY',
      });

      expect(resolved.price).toBe('1150');
      expect(resolved.explanation).toBe('¥1,000 → +15% → .99 = ¥1,150');
    });

    it('keeps two digits for three-decimal currencies, as prices are stored', () => {
      const resolved = resolver.resolve(variant({ price: '10.00' }), {
        rule: rule({ adjustmentPercent: '3.33' }),
        currencyCode: 'KWD',
      });

      expect(resolved.price).toBe('10.33');
    });
  });
});

describe('ChannelPriceResolver conversion', () => {
  const toEuro = (rate: string | null) => ({
    from: USD,
    to: 'EUR',
    rate,
    source: ExchangeRateSource.Ecb,
    publishedOn: '2026-11-04',
  });

  it('converts the catalog price before the rule and shows the step', () => {
    const resolved = resolver.resolve(variant({ price: '10.00', cost: '4.00' }), {
      rule: rule({ adjustmentPercent: '10', rounding: PriceRounding.Ending99 }),
      currencyCode: 'EUR',
      conversion: toEuro('0.92'),
    });

    expect(resolved.steps.map((step) => step.kind)).toEqual([
      PriceStepKind.Base,
      PriceStepKind.Conversion,
      PriceStepKind.Percent,
      PriceStepKind.Rounding,
    ]);
    expect(resolved.price).toBe('10.99');
    expect(resolved.unitCost).toBe('3.68');
    expect(resolved.explanation).toContain('× 0.92 (USD → EUR)');
  });

  it('explains a conversion even without a rule', () => {
    const resolved = resolver.resolve(variant({ price: '10.00' }), {
      rule: null,
      currencyCode: 'EUR',
      conversion: toEuro('0.92'),
    });
    expect(resolved.price).toBe('9.20');
    expect(resolved.explanation).toMatch(/0\.92.*= €9\.20/);
  });

  it('leaves a manual price alone: it is already in the store’s currency', () => {
    const resolved = resolver.resolve(
      variant({ price: '10.00' }),
      { rule: null, currencyCode: 'EUR', conversion: toEuro('0.92') },
      { price: '12.00', compareAtPrice: null },
    );
    expect(resolved).toMatchObject({ price: '12.00', source: PriceSource.Override });
  });

  it('flags a price it could not convert', () => {
    const resolved = resolver.resolve(variant(), {
      rule: null,
      currencyCode: 'EUR',
      conversion: toEuro(null),
    });
    expect(resolved.warnings).toContain(PriceWarning.NoExchangeRate);
  });
});
