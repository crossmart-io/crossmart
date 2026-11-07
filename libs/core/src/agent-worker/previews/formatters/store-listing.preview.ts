import { z } from 'zod';
import { AgentToolName } from '../../../agent-tools/agent-tools.constants.js';
import type { AgentWorkerActionPreview } from '../../entities/agent-worker-views.js';
import type { ActionPreviewFormatter } from '../action-preview-formatter.js';
import { PREVIEW_HEADLINES } from '../preview.constants.js';
import type { PreviewReader } from '../preview-reader.js';
import { productOnStore } from '../preview-values.js';

const INPUT = z.object({ productId: z.string(), connectionId: z.string() });

/** Publishing, retrying or removing one product on one store: a sentence and the two names. */
export class StoreListingPreview implements ActionPreviewFormatter {
  constructor(
    readonly tool: AgentToolName,
    private readonly headline: string,
  ) {}

  async preview(
    input: Record<string, unknown>,
    reader: PreviewReader,
  ): Promise<AgentWorkerActionPreview> {
    const { productId, connectionId } = INPUT.parse(input);
    return {
      target: await productOnStore(reader, productId, connectionId),
      headline: this.headline,
      details: [],
      changes: [],
    };
  }
}

export const STORE_LISTING_PREVIEWS: readonly ActionPreviewFormatter[] = [
  new StoreListingPreview(AgentToolName.AddProductToStore, PREVIEW_HEADLINES.addToStore),
  new StoreListingPreview(AgentToolName.RemoveProductFromStore, PREVIEW_HEADLINES.removeFromStore),
  new StoreListingPreview(AgentToolName.RetryStoreListing, PREVIEW_HEADLINES.retryListing),
];
