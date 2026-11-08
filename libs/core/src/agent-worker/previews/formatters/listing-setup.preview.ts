import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type { AgentWorkerActionPreview } from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import {
  LIST_SEPARATOR,
  PREVIEW_HEADLINES,
  PREVIEW_LABELS,
  REMOVED_ASPECT,
} from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import { change, productOnStore } from '../preview-values.js';

const ON_STORE = { productId: z.string(), connectionId: z.string() };
const CATEGORY_INPUT = z.object({
  ...ON_STORE,
  category: z.object({ id: z.string(), name: z.string() }).nullable(),
});
const ITEM_SPECIFICS_INPUT = z.object({
  ...ON_STORE,
  itemSpecifics: z.array(z.object({ name: z.string(), values: z.array(z.string()) })),
});

/** `set_store_category`: the category chosen, or that the next publish picks one. */
export class CategoryPreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.SetStoreCategory;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const { productId, connectionId, category } = CATEGORY_INPUT.parse(input);
    return {
      target: await productOnStore(reader, productId, connectionId),
      headline: category
        ? PREVIEW_HEADLINES.setCategory(category.name)
        : PREVIEW_HEADLINES.autoCategory,
      details: [],
      changes: category ? change(PREVIEW_LABELS.category, null, category.name) : [],
    };
  }
}

/** `save_item_specifics`: each aspect and the values it gets. */
export class ItemSpecificsPreview implements ActionPreviewFormatter {
  readonly tool = AgentToolName.SaveItemSpecifics;

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const { productId, connectionId, itemSpecifics } = ITEM_SPECIFICS_INPUT.parse(input);
    return {
      target: await productOnStore(reader, productId, connectionId),
      headline: PREVIEW_HEADLINES.itemSpecifics(itemSpecifics.length),
      details: itemSpecifics.map(
        ({ name, values }) => `${name}: ${values.join(LIST_SEPARATOR) || REMOVED_ASPECT}`,
      ),
      changes: [],
    };
  }
}
