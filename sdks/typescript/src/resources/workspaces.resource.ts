import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import type { CurrentApiKey, UpdateWorkspaceInput, Workspace } from '../types.js';
import { Resource } from './resource.js';

const WORKSPACE_PATH = '/api/v1/workspaces/{workspaceId}';
const CURRENT_API_KEY_PATH = '/api/v1/api-key';

/** The workspace itself, and what the current credentials may do in it. */
export class WorkspacesResource extends Resource {
  /**
   * The workspace, with the caller's role and `permissions`. Check permissions rather than role
   * names: they keep working when roles change.
   *
   * @example
   * ```ts
   * const workspace = await crossmart.workspaces.get();
   * const canPublish = workspace.permissions.includes(WorkspacePermission.listings_edit);
   * ```
   */
  async get(options?: RequestOptions): Promise<Workspace> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(WORKSPACE_PATH, { params: { path: { workspaceId } }, signal: options?.signal }),
    );
  }

  /**
   * Renames the workspace or changes its time zone. Needs `workspace:manage`.
   *
   * @example
   * ```ts
   * await crossmart.workspaces.update({ timeZone: 'Europe/Berlin' });
   * ```
   */
  async update(input: UpdateWorkspaceInput, options?: RequestOptions): Promise<Workspace> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.PATCH(WORKSPACE_PATH, {
        params: { path: { workspaceId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }

  /**
   * The API key making the call: its workspace, role and permissions. Only for API keys.
   *
   * @example
   * ```ts
   * const key = await crossmart.workspaces.currentApiKey();
   * console.log(key.workspaceId, key.role);
   * ```
   */
  async currentApiKey(options?: Pick<RequestOptions, 'signal'>): Promise<CurrentApiKey> {
    return unwrap(this.http.GET(CURRENT_API_KEY_PATH, { signal: options?.signal }));
  }
}
