import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type { AgentWorkerActionPreview } from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import { FIELD_JOINER, PREVIEW_HEADLINES, PREVIEW_LABELS } from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import { change } from '../preview-values.js';

const INPUT = z.object({
  productId: z.string(),
  title: z.string().optional(),
  descriptionHtml: z.string().optional(),
});

/** `update_product_text`: the title and description before and after, nothing else. */
export class ProductTextPreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.UpdateProductText;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const edit = INPUT.parse(input);
    const product = await reader.product(edit.productId);
    const changes = [
      ...(edit.title === undefined ? [] : change(PREVIEW_LABELS.title, product.title, edit.title)),
      ...(edit.descriptionHtml === undefined
        ? []
        : change(PREVIEW_LABELS.description, product.descriptionHtml, edit.descriptionHtml)),
    ];
    const fields = changes.map((entry) => entry.label.toLowerCase()).join(FIELD_JOINER);
    return {
      target: product.title,
      headline: PREVIEW_HEADLINES.productText(fields || PREVIEW_LABELS.title.toLowerCase()),
      details: [],
      changes,
    };
  }
}
