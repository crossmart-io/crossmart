import {
  CURRENT_API_KEY_PATH,
  NO_CONTENT_STATUS,
  WORKSPACE_PLACEHOLDER,
} from '../agent-tools.constants.js';
import type { ApiCredential } from './api-credential.js';
import { type ApiCall, HttpMethod, type QueryValue } from './api-call.js';
import { CrossmartApiError } from './crossmart-api.error.js';

interface CurrentApiKey {
  workspaceId: string;
}

interface ApiErrorBody {
  message?: string | string[];
  code?: string;
}

/**
 * The Crossmart REST API, called with one credential: an API key or an agent's access token. The
 * MCP server never touches the database: every tool goes through the API, so agents meet the
 * same validation, permissions and audit log as the web app.
 */
export class CrossmartApiClient {
  private workspaceId: Promise<string> | undefined;

  constructor(
    private readonly baseUrl: string,
    private credential: ApiCredential | undefined,
  ) {}

  /**
   * Starts calling with `credential` when the client has none yet, such as the key of a sandbox
   * account the agent just opened. A client that already has one keeps it.
   */
  adoptCredential(credential: ApiCredential): void {
    if (this.credential) return;
    this.credential = credential;
    this.workspaceId = undefined;
  }

  async call(call: ApiCall): Promise<unknown> {
    const path = call.path.includes(WORKSPACE_PLACEHOLDER)
      ? call.path.replace(WORKSPACE_PLACEHOLDER, await this.currentWorkspace())
      : call.path;
    return this.send(call.method, this.toUrl(path, call.query), call.body);
  }

  /** The workspace the credential works in: named by an agent token, else asked once per client. */
  private currentWorkspace(): Promise<string> {
    const named = this.credential?.workspaceId;
    if (named) return Promise.resolve(named);
    this.workspaceId ??= this.send(HttpMethod.Get, this.toUrl(CURRENT_API_KEY_PATH)).then(
      (key) => (key as CurrentApiKey).workspaceId,
    );
    return this.workspaceId;
  }

  private toUrl(path: string, query: Record<string, QueryValue> = {}): URL {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    return url;
  }

  private async send(method: HttpMethod, url: URL, body?: unknown): Promise<unknown> {
    const headers: Record<string, string> = {
      accept: 'application/json',
      ...this.credential?.headers,
    };
    if (body !== undefined) headers['content-type'] = 'application/json';
    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) throw await this.toError(response);
    return response.status === NO_CONTENT_STATUS ? { done: true } : response.json();
  }

  private async toError(response: Response): Promise<CrossmartApiError> {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const message = Array.isArray(body.message) ? body.message.join('; ') : body.message;
    return new CrossmartApiError(response.status, message ?? response.statusText, body.code);
  }
}
