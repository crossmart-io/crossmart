import type { ResolvedPrice } from './price-resolution.js';

export interface PricingPreviewVariant {
  variantId: string;
  title: string;
  basePrice: string;
  cost: string | null;
  resolved: ResolvedPrice;
}

/** A pricing rule applied to a real product, so the merchant sees what it does. */
export interface PricingPreview {
  currencyCode: string;
  product: { id: string; title: string } | null;
  variants: PricingPreviewVariant[];
}
