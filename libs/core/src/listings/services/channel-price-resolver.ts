import { Injectable } from '@nestjs/common';
import {
  currencyFractionDigits,
  FixedDecimal,
  formatCurrency,
  RoundingMode,
} from '@crossmart/common';
import { PRICE_MAX_FRACTION_DIGITS } from '../../channels/channels.constants.js';
import type { PricingFloor, PricingRule } from '../../channels/entities/pricing-rule.js';
import { CompareAtMode } from '../../channels/enums/compare-at-mode.enum.js';
import { PriceRounding } from '../../channels/enums/price-rounding.enum.js';
import type {
  PriceConversion,
  PriceStep,
  PricingContext,
  ResolvedPrice,
  VariantPriceOverride,
  VariantPricing,
} from '../entities/price-resolution.js';
import { PriceSource } from '../enums/price-source.enum.js';
import { PriceStepKind } from '../enums/price-step-kind.enum.js';
import { PriceWarning } from '../enums/price-warning.enum.js';
import {
  BASE_PRICE_LABEL,
  CHARM_ENDING_MIN_FRACTION_DIGITS,
  MANUAL_PRICE_LABEL,
  PRICE_RESULT_SEPARATOR,
  PRICE_STEP_SEPARATOR,
  ROUNDING_ENDINGS,
  ROUNDING_LABELS,
} from '../listings.constants.js';

const PLUS = '+';
const MINUS = '-';
const PERCENT = '%';
const CONVERSION_ARROW = ' → ';

/** The currency a resolution runs in: its precision, and how amounts read. */
class Currency {
  readonly digits: number;

  constructor(readonly code: string) {
    this.digits = Math.min(currencyFractionDigits(code), PRICE_MAX_FRACTION_DIGITS);
  }

  amount(value: FixedDecimal): string {
    return value.toFixed(this.digits);
  }

  format(value: FixedDecimal): string {
    return formatCurrency(this.amount(value), this.code);
  }
}

/** A variant's catalog amounts in the channel's currency, and what they were before. */
interface ChannelAmounts extends VariantPricing {
  /** Set when the amounts were converted from the catalog's currency. */
  converted: { original: FixedDecimal; from: string; rate: string } | null;
}

/** The steps and warnings of one resolution, collected as it runs. */
class PriceTrail {
  readonly steps: PriceStep[] = [];
  readonly warnings = new Set<PriceWarning>();

  constructor(readonly currency: Currency) {}

  add(kind: PriceStepKind, label: string, value: FixedDecimal): FixedDecimal {
    this.steps.push({ kind, label, amount: this.currency.amount(value) });
    return value;
  }
}

function signed(text: string, negative: boolean): string {
  return `${negative ? MINUS : PLUS}${text}`;
}

function percentLabel(percent: FixedDecimal): string {
  return signed(`${percent.abs().toString()}${PERCENT}`, percent.isNegative());
}

/**
 * Resolves the price a channel receives for a variant, with an explanation a merchant can
 * check: a manual price for the listing wins, then the connection's rule, then the variant's
 * own price. Pure: it reads nothing and has no side effects, so the API, the publish flow and
 * previews all agree. Amounts are exact decimals, never floats.
 */
@Injectable()
export class ChannelPriceResolver {
  resolve(
    variant: VariantPricing,
    context: PricingContext,
    override?: VariantPriceOverride | null,
  ): ResolvedPrice {
    const trail = new PriceTrail(new Currency(context.currencyCode));
    const amounts = this.inChannelCurrency(variant, context.conversion ?? null, trail);
    const { price, source } = this.resolvePrice(amounts, context.rule, override ?? null, trail);
    const compareAtPrice = this.resolveCompareAt(amounts, context.rule, override ?? null, trail);
    const sentCompareAt = this.keepIfAbove(compareAtPrice, price, trail);
    return {
      price: trail.currency.amount(price),
      compareAtPrice: sentCompareAt ? trail.currency.amount(sentCompareAt) : null,
      source,
      steps: trail.steps,
      explanation: this.explain(trail, source, price),
      warnings: [...trail.warnings],
      unitCost: amounts.cost ? trail.currency.amount(FixedDecimal.of(amounts.cost)) : null,
    };
  }

  /**
   * The variant's price, compare-at price and cost in the channel's currency. Without a known
   * rate they stay as they are and the price is flagged, so it is never sent.
   */
  private inChannelCurrency(
    variant: VariantPricing,
    conversion: PriceConversion | null,
    trail: PriceTrail,
  ): ChannelAmounts {
    if (!conversion) return { ...variant, converted: null };
    if (!conversion.rate) {
      trail.warnings.add(PriceWarning.NoExchangeRate);
      return { ...variant, converted: null };
    }
    const rate = FixedDecimal.of(conversion.rate);
    const convert = (amount: string | null): string | null =>
      amount === null ? null : FixedDecimal.of(amount).times(rate).toString();
    return {
      price: convert(variant.price) ?? variant.price,
      compareAtPrice: convert(variant.compareAtPrice),
      cost: convert(variant.cost),
      converted: {
        original: FixedDecimal.of(variant.price),
        from: conversion.from,
        rate: conversion.rate,
      },
    };
  }

  private resolvePrice(
    variant: ChannelAmounts,
    rule: PricingRule | null,
    override: VariantPriceOverride | null,
    trail: PriceTrail,
  ): { price: FixedDecimal; source: PriceSource } {
    const base = FixedDecimal.of(variant.price);
    if (override?.price) {
      const manual = trail.add(
        PriceStepKind.Override,
        MANUAL_PRICE_LABEL,
        FixedDecimal.of(override.price),
      );
      this.warnIfBelowFloor(manual, variant.cost, rule?.floor ?? null, trail);
      return { price: manual, source: PriceSource.Override };
    }
    this.recordBase(variant, base, trail);
    if (!rule) {
      return { price: base, source: PriceSource.Base };
    }
    const adjusted = this.applyRule(base, rule, trail, true);
    return {
      price: this.applyFloor(adjusted, variant.cost, rule, trail),
      source: PriceSource.Rule,
    };
  }

  /** The base price, in the catalog's currency and then converted when the two differ. */
  private recordBase(variant: ChannelAmounts, base: FixedDecimal, trail: PriceTrail): void {
    const { converted } = variant;
    if (!converted) {
      trail.add(PriceStepKind.Base, trail.currency.format(base), base);
      return;
    }
    const original = formatCurrency(converted.original.toString(), converted.from);
    trail.add(PriceStepKind.Base, original, converted.original);
    const label = `× ${converted.rate} (${converted.from}${CONVERSION_ARROW}${trail.currency.code})`;
    trail.add(PriceStepKind.Conversion, label, base);
  }

  /** Percent, then fixed amount, then rounding. Records the steps when `record` is set. */
  private applyRule(
    base: FixedDecimal,
    rule: PricingRule,
    trail: PriceTrail,
    record: boolean,
  ): FixedDecimal {
    const percent = FixedDecimal.of(rule.adjustmentPercent);
    const fixed = FixedDecimal.of(rule.fixedAmount);
    let value = base;
    if (!percent.isZero()) {
      value = value.adjustedByPercent(percent);
      if (record) trail.add(PriceStepKind.Percent, percentLabel(percent), value);
    }
    if (!fixed.isZero()) {
      value = value.plus(fixed);
      const label = signed(trail.currency.format(fixed.abs()), fixed.isNegative());
      if (record) trail.add(PriceStepKind.FixedAmount, label, value);
    }
    if (value.isNegative()) {
      value = FixedDecimal.ZERO;
      trail.warnings.add(PriceWarning.ClampedToZero);
    }
    const rounded = this.round(value, rule.rounding, trail.currency);
    if (record && rule.rounding !== PriceRounding.None) {
      trail.add(PriceStepKind.Rounding, ROUNDING_LABELS[rule.rounding], rounded);
    }
    return rounded;
  }

  /** Rounds to the currency's precision, then up to the rounding's ending. */
  private round(value: FixedDecimal, rounding: PriceRounding, currency: Currency): FixedDecimal {
    const precise = value.round(currency.digits, RoundingMode.HalfUp);
    const ending = ROUNDING_ENDINGS[rounding];
    if (rounding === PriceRounding.None) {
      return precise;
    }
    if (!ending || currency.digits < CHARM_ENDING_MIN_FRACTION_DIGITS) {
      return precise.round(0, RoundingMode.Up);
    }
    const candidate = precise.round(0, RoundingMode.Down).plus(FixedDecimal.of(ending));
    return candidate.lessThan(precise) ? candidate.plus(FixedDecimal.fromInteger(1)) : candidate;
  }

  /** The lowest price the floor allows (cost plus margin, rounded up), or null without one. */
  private floorOf(
    cost: string | null,
    floor: PricingFloor | null,
    trail: PriceTrail,
  ): FixedDecimal | null {
    if (!floor) return null;
    if (!cost) {
      trail.warnings.add(PriceWarning.MissingCost);
      return null;
    }
    return FixedDecimal.of(cost)
      .adjustedByPercent(FixedDecimal.of(floor.minMarginPercent))
      .round(trail.currency.digits, RoundingMode.Up);
  }

  private applyFloor(
    price: FixedDecimal,
    cost: string | null,
    rule: PricingRule,
    trail: PriceTrail,
  ): FixedDecimal {
    const floor = this.floorOf(cost, rule.floor, trail);
    if (!floor || !price.lessThan(floor) || !cost || !rule.floor) {
      return price;
    }
    const floored = this.round(floor, rule.rounding, trail.currency);
    const costText = trail.currency.format(FixedDecimal.of(cost));
    const label = `floor ${trail.currency.format(floor)} (cost ${costText} + ${rule.floor.minMarginPercent}%)`;
    return trail.add(PriceStepKind.Floor, label, floored);
  }

  private warnIfBelowFloor(
    price: FixedDecimal,
    cost: string | null,
    floor: PricingFloor | null,
    trail: PriceTrail,
  ): void {
    const lowest = this.floorOf(cost, floor, trail);
    if (lowest && price.lessThan(lowest)) {
      trail.warnings.add(PriceWarning.BelowFloor);
    }
  }

  private resolveCompareAt(
    variant: ChannelAmounts,
    rule: PricingRule | null,
    override: VariantPriceOverride | null,
    trail: PriceTrail,
  ): FixedDecimal | null {
    if (override?.compareAtPrice) {
      return FixedDecimal.of(override.compareAtPrice);
    }
    const base = variant.compareAtPrice ? FixedDecimal.of(variant.compareAtPrice) : null;
    if (!base || !rule || rule.compareAt === CompareAtMode.Keep) {
      return base;
    }
    return rule.compareAt === CompareAtMode.Omit ? null : this.applyRule(base, rule, trail, false);
  }

  /** Channels show a sale only when the compare-at price is above the price. */
  private keepIfAbove(
    compareAt: FixedDecimal | null,
    price: FixedDecimal,
    trail: PriceTrail,
  ): FixedDecimal | null {
    if (!compareAt) return null;
    if (compareAt.greaterThan(price)) return compareAt;
    trail.warnings.add(PriceWarning.CompareAtDropped);
    return null;
  }

  private explain(trail: PriceTrail, source: PriceSource, price: FixedDecimal): string {
    const result = trail.currency.format(price);
    const converted = trail.steps.some((step) => step.kind === PriceStepKind.Conversion);
    if (source === PriceSource.Base && !converted) {
      return `${BASE_PRICE_LABEL}${PRICE_RESULT_SEPARATOR}${result}`;
    }
    const labels = trail.steps.map((step) => step.label);
    return `${labels.join(PRICE_STEP_SEPARATOR)}${PRICE_RESULT_SEPARATOR}${result}`;
  }
}
