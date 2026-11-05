import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import type {
  AiStatus,
  AiUsageQuery,
  AiUsageReport,
  ContentDraft,
  ContentDraftInput,
  ContentGenerationReceipt,
  GenerateContentInput,
} from '../types.js';
import { Resource } from './resource.js';

const AI_STATUS_PATH = '/api/v1/workspaces/{workspaceId}/ai/status';
const AI_USAGE_PATH = '/api/v1/workspaces/{workspaceId}/ai/usage';
const CONTENT_GENERATIONS_PATH = '/api/v1/workspaces/{workspaceId}/ai/content-generations';
const CONTENT_DRAFTS_PATH = '/api/v1/workspaces/{workspaceId}/ai/content-drafts';

/**
 * AI writing. Generated content never changes a product directly: `generateContent` creates
 * suggestions to review (see `crossmart.suggestions`), and `draftContent` returns text for you
 * to use. Generating needs `ai:generate`; calls are metered.
 */
export class AiResource extends Resource {
  /**
   * Whether the server has an AI provider configured, and which model it uses.
   *
   * @example
   * ```ts
   * const status = await crossmart.ai.status();
   * ```
   */
  async status(options?: RequestOptions): Promise<AiStatus> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(AI_STATUS_PATH, { params: { path: { workspaceId } }, signal: options?.signal }),
    );
  }

  /**
   * AI calls and tokens per feature over a period.
   *
   * @example
   * ```ts
   * const usage = await crossmart.ai.usage({ from: '2026-10-01T00:00:00Z', to: '2026-11-01T00:00:00Z' });
   * ```
   */
  async usage(query: AiUsageQuery = {}, options?: RequestOptions): Promise<AiUsageReport> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(AI_USAGE_PATH, {
        params: { path: { workspaceId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Queues AI titles and descriptions for products on one store. Each result arrives as a
   * pending suggestion.
   *
   * @example
   * ```ts
   * const { queued } = await crossmart.ai.generateContent({ connectionId, productIds: [productId] });
   * ```
   */
  async generateContent(
    input: GenerateContentInput,
    options?: RequestOptions,
  ): Promise<ContentGenerationReceipt> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(CONTENT_GENERATIONS_PATH, {
        params: { path: { workspaceId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }

  /**
   * Writes a title or description for one product right away and returns it without saving.
   *
   * @example
   * ```ts
   * const draft = await crossmart.ai.draftContent({
   *   productId,
   *   fields: [ContentField.title, ContentField.description],
   *   instruction: 'Mention that it is dishwasher safe',
   * });
   * ```
   */
  async draftContent(input: ContentDraftInput, options?: RequestOptions): Promise<ContentDraft> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(CONTENT_DRAFTS_PATH, {
        params: { path: { workspaceId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }
}
