import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type { AgentWorkerActionPreview } from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import { PREVIEW_HEADLINES, PREVIEW_LABELS } from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import { change, money, priceLabel, variantName } from '../preview-values.js';

const CREATE_INPUT = z.object({
  title: z.string(),
  status: z.string().optional(),
  variants: z.array(
    z.object({
      sku: z.string().optional(),
      optionValues: z.array(z.string()).optional(),
      price: z.string(),
    }),
  ),
});
const GENERATE_INPUT = z.object({ connectionId: z.string(), productIds: z.array(z.string()) });
const DRAFT_STATUS = 'DRAFT';

/** `create_product`: its title, status and the price of each variant. */
export class ProductCreatePreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.CreateProduct;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const product = CREATE_INPUT.parse(input);
    const currency = await reader.workspaceCurrency();
    const status = (product.status ?? DRAFT_STATUS).toLowerCase();
    return {
      target: product.title,
      headline: PREVIEW_HEADLINES.createProduct(product.variants.length, status),
      details: [],
      changes: [
        ...change(PREVIEW_LABELS.title, null, product.title),
        ...product.variants.flatMap((variant) =>
          change(priceLabel(variantName(variant)), null, money(variant.price, currency)),
        ),
      ],
    };
  }
}

/** `generate_content`: how many products, for which store, and that results need review. */
export class ContentGenerationPreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.GenerateContent;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const { connectionId, productIds } = GENERATE_INPUT.parse(input);
    const store = await reader.store(connectionId);
    return {
      target: store.displayName,
      headline: PREVIEW_HEADLINES.generateContent(productIds.length, store.displayName),
      details: [],
      changes: [],
    };
  }
}

/** `approve_suggestion`: the suggestion itself is shown in the suggestions inbox. */
export class SuggestionApprovalPreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.ApproveSuggestion;

  preview(): Promise<AgentWorkerActionPreview> {
    return Promise.resolve({
      target: null,
      headline: PREVIEW_HEADLINES.approveSuggestion,
      details: [],
      changes: [],
    });
  }
}
