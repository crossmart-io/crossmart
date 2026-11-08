import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type {
  AgentWorkerActionPreview,
  AgentWorkerChange,
} from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import { NONE, PREVIEW_HEADLINES } from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import type { ProductSource } from '../preview-sources.js';
import { change, compareAtPriceLabel, money, priceLabel, variantName } from '../preview-values.js';

const INPUT = z.object({
  productId: z.string(),
  variantId: z.string(),
  price: z.string().optional(),
  compareAtPrice: z.string().nullable().optional(),
});
type VariantPriceEdit = z.infer<typeof INPUT>;
type ProductVariant = ProductSource['variants'][number];

function priceChanges(
  variant: ProductVariant,
  edit: VariantPriceEdit,
  currency: string,
): AgentWorkerChange[] {
  const name = variantName(variant);
  const price =
    edit.price === undefined
      ? []
      : change(priceLabel(name), money(variant.price, currency), money(edit.price, currency));
  const compareAt =
    edit.compareAtPrice === undefined
      ? []
      : change(
          compareAtPriceLabel(name),
          money(variant.compareAtPrice, currency) ?? NONE,
          money(edit.compareAtPrice, currency) ?? NONE,
        );
  return [...price, ...compareAt];
}

/** `update_variant_price`: "Price (SKU) $48.00 → $43.00", in the workspace currency. */
export class VariantPricePreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.UpdateVariantPrice;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const edit = INPUT.parse(input);
    const [product, currency] = await Promise.all([
      reader.product(edit.productId),
      reader.workspaceCurrency(),
    ]);
    const variant = product.variants.find((candidate) => candidate.id === edit.variantId);
    if (!variant) throw new Error(`Variant ${edit.variantId} is not one of ${edit.productId}'s`);
    return {
      target: product.title,
      headline: PREVIEW_HEADLINES.variantPrice(variantName(variant)),
      details: [],
      changes: priceChanges(variant, edit, currency),
    };
  }
}
