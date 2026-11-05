import { MAX_PAGE_SIZE } from '../crossmart.constants.js';
import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import { type Page, paginate } from '../pagination.js';
import type {
  BulkReviewResult,
  ListAllSuggestionsQuery,
  ListSuggestionsQuery,
  Suggestion,
} from '../types.js';
import { Resource } from './resource.js';

const SUGGESTIONS_PATH = '/api/v1/workspaces/{workspaceId}/suggestions';
const SUGGESTION_PATH = '/api/v1/workspaces/{workspaceId}/suggestions/{suggestionId}';
const APPROVE_PATH = '/api/v1/workspaces/{workspaceId}/suggestions/{suggestionId}/approve';
const REJECT_PATH = '/api/v1/workspaces/{workspaceId}/suggestions/{suggestionId}/reject';
const BULK_APPROVE_PATH = '/api/v1/workspaces/{workspaceId}/suggestions/bulk-approve';

/**
 * Proposed changes, such as AI-written titles, with the current value, the proposed one and a
 * rationale. Reading needs `suggestions:view`; approving or rejecting needs `suggestions:approve`
 * (Owner, Admin or Approver), so an Editor key can propose but never apply.
 */
export class SuggestionsResource extends Resource {
  /**
   * One page of suggestions.
   *
   * @example
   * ```ts
   * const pending = await crossmart.suggestions.list({ status: SuggestionStatus.PENDING });
   * ```
   */
  async list(
    query: ListSuggestionsQuery = {},
    options?: RequestOptions,
  ): Promise<Page<Suggestion>> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(SUGGESTIONS_PATH, {
        params: { path: { workspaceId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Every suggestion that matches `query`.
   *
   * @example
   * ```ts
   * for await (const suggestion of crossmart.suggestions.listAll({ productId })) {
   *   console.log(suggestion.kind, suggestion.proposedValue);
   * }
   * ```
   */
  listAll(
    query: ListAllSuggestionsQuery = {},
    options?: RequestOptions,
  ): AsyncGenerator<Suggestion, void> {
    return paginate((cursor) => this.list({ limit: MAX_PAGE_SIZE, ...query, cursor }, options));
  }

  /**
   * One suggestion.
   *
   * @example
   * ```ts
   * const suggestion = await crossmart.suggestions.get(suggestionId);
   * ```
   */
  async get(suggestionId: string, options?: RequestOptions): Promise<Suggestion> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(SUGGESTION_PATH, {
        params: { path: { workspaceId, suggestionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Applies a pending suggestion. It comes back `APPLIED`, or `STALE` when the field changed
   * since it was proposed.
   *
   * @example
   * ```ts
   * const applied = await crossmart.suggestions.approve(suggestionId);
   * ```
   */
  async approve(suggestionId: string, options?: RequestOptions): Promise<Suggestion> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(APPROVE_PATH, {
        params: { path: { workspaceId, suggestionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Rejects a pending suggestion.
   *
   * @example
   * ```ts
   * await crossmart.suggestions.reject(suggestionId);
   * ```
   */
  async reject(suggestionId: string, options?: RequestOptions): Promise<Suggestion> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(REJECT_PATH, {
        params: { path: { workspaceId, suggestionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Approves several pending suggestions. Ids that are not pending are returned in `skippedIds`.
   *
   * @example
   * ```ts
   * const { items, skippedIds } = await crossmart.suggestions.approveMany([firstId, secondId]);
   * ```
   */
  async approveMany(suggestionIds: string[], options?: RequestOptions): Promise<BulkReviewResult> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(BULK_APPROVE_PATH, {
        params: { path: { workspaceId } },
        body: { suggestionIds },
        signal: options?.signal,
      }),
    );
  }
}
