import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type {
  AgentWorkerActionPreview,
  AgentWorkerChange,
} from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import { NEW_VARIANT_NAME, PREVIEW_HEADLINES, PREVIEW_LABELS } from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import type { ProductSource } from '../preview-sources.js';
import { change, money, priceLabel, variantName } from '../preview-values.js';

const VARIANT = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  optionValues: z.array(z.string()).optional(),
  price: z.string(),
});
const INPUT = z.object({
  productId: z.string(),
  title: z.string(),
  descriptionHtml: z.string().optional(),
  vendor: z.string().optional(),
  productType: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.string().optional(),
  condition: z.string().nullable().optional(),
  variants: z.array(VARIANT),
});
type ProductReplacement = z.infer<typeof INPUT>;

const TEXT_FIELDS = [
  ['title', PREVIEW_LABELS.title],
  ['descriptionHtml', PREVIEW_LABELS.description],
  ['vendor', PREVIEW_LABELS.vendor],
  ['productType', PREVIEW_LABELS.productType],
  ['tags', PREVIEW_LABELS.tags],
  ['status', PREVIEW_LABELS.status],
  ['condition', PREVIEW_LABELS.condition],
] as const;

function fieldChanges(product: ProductSource, input: ProductReplacement): AgentWorkerChange[] {
  return TEXT_FIELDS.flatMap(([field, label]) =>
    input[field] === undefined ? [] : change(label, product[field], input[field]),
  );
}

function priceChanges(
  product: ProductSource,
  input: ProductReplacement,
  currency: string,
): AgentWorkerChange[] {
  return input.variants.flatMap((variant) => {
    const current = product.variants.find((candidate) => candidate.id === variant.id);
    const name = current ? variantName(current) : (variant.sku ?? NEW_VARIANT_NAME);
    return change(
      priceLabel(name),
      money(current?.price, currency),
      money(variant.price, currency),
    );
  });
}

/** `replace_product`: every field and price it changes, and that what is left out is removed. */
export class ProductReplacePreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.ReplaceProduct;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const replacement = INPUT.parse(input);
    const [product, currency] = await Promise.all([
      reader.product(replacement.productId),
      reader.workspaceCurrency(),
    ]);
    return {
      target: product.title,
      headline: PREVIEW_HEADLINES.replaceProduct,
      details: [],
      changes: [
        ...fieldChanges(product, replacement),
        ...priceChanges(product, replacement, currency),
      ],
    };
  }
}
