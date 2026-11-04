import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import type { PriceSource } from '../enums/price-source.enum.js';
import type { PriceStepKind } from '../enums/price-step-kind.enum.js';
import type { PriceWarning } from '../enums/price-warning.enum.js';

/** A variant's catalog amounts, as exact decimal strings. */
export interface VariantPricing {
  price: string;
  compareAtPrice: string | null;
  cost: string | null;
}

/** What the merchant fixed for this variant on one listing. Null fields follow the rule. */
export interface VariantPriceOverride {
  price: string | null;
  compareAtPrice: string | null;
}

export interface PricingContext {
  rule: PricingRule | null;
  /** ISO 4217 code of the channel's currency; sets precision and formatting. */
  currencyCode: string;
}

export interface PriceStep {
  kind: PriceStepKind;
  /** The step as the explanation shows it: "+15%", ".99", "floor $52.00". */
  label: string;
  /** The price after this step. */
  amount: string;
}

/** The price a channel receives for a variant, and how it was reached. */
export interface ResolvedPrice {
  price: string;
  compareAtPrice: string | null;
  source: PriceSource;
  steps: PriceStep[];
  /** One line for people: "$89.00 → +15% → .99 = $102.99". */
  explanation: string;
  warnings: PriceWarning[];
}
