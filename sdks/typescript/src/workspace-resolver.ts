import { MISSING_WORKSPACE_MESSAGE } from './crossmart.constants.js';
import { CrossmartError } from './errors.js';
import type { RequestOptions } from './options.js';

/** Looks up the workspace the credentials belong to, when they can say. */
export type WorkspaceDiscovery = () => Promise<string>;

/**
 * Picks the workspace a call acts on: the call's `workspaceId`, else the client's default, else
 * (for API keys) the key's own workspace, fetched once and cached.
 */
export class WorkspaceResolver {
  private discovered: Promise<string> | undefined;

  constructor(
    private readonly defaultWorkspaceId: string | undefined,
    private readonly discover: WorkspaceDiscovery | undefined,
  ) {}

  resolve(options?: RequestOptions): Promise<string> {
    const explicit = options?.workspaceId ?? this.defaultWorkspaceId;
    if (explicit !== undefined) {
      return Promise.resolve(explicit);
    }
    if (this.discover === undefined) {
      return Promise.reject(new CrossmartError(MISSING_WORKSPACE_MESSAGE));
    }
    this.discovered ??= this.discover().catch((error: unknown) => {
      // A failed lookup is not cached, so the next call tries again.
      this.discovered = undefined;
      throw error;
    });
    return this.discovered;
  }
}
