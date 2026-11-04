import type { PricingRule } from '../../channels/entities/pricing-rule.js';
import type { ExchangeRateSource } from '../enums/exchange-rate-source.enum.js';
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

/** How catalog amounts reach the channel's currency, when the two differ. */
export interface PriceConversion {
  /** The workspace's currency, which catalog prices are in. */
  from: string;
  /** The channel's currency. */
  to: string;
  /** Units of `to` per unit of `from`, or null when no rate is known. */
  rate: string | null;
  source: ExchangeRateSource;
  /** The day an ECB rate was published; null for a fixed rate. */
  publishedOn: string | null;
}

export interface PricingContext {
  rule: PricingRule | null;
  /** ISO 4217 code of the channel's currency; sets precision and formatting. */
  currencyCode: string;
  /** Null when the channel sells in the workspace's currency. */
  conversion?: PriceConversion | null;
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
  /** The variant's cost in the channel's currency, for channels that track it. */
  unitCost: string | null;
}
