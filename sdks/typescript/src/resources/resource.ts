import type { Client } from 'openapi-fetch';
import type { paths } from '../generated/schema.js';
import type { RequestOptions } from '../options.js';
import type { WorkspaceResolver } from '../workspace-resolver.js';

/** The typed HTTP client every resource calls through. */
export type CrossmartHttpClient = Client<paths>;

/** What the client shares with its resources. */
export interface ResourceContext {
  readonly http: CrossmartHttpClient;
  readonly workspaces: WorkspaceResolver;
}

/** Base of the resource classes (`crossmart.products`, `crossmart.orders`…). */
export abstract class Resource {
  constructor(protected readonly context: ResourceContext) {}

  protected get http(): CrossmartHttpClient {
    return this.context.http;
  }

  /** The workspace the call acts on. */
  protected workspaceId(options?: RequestOptions): Promise<string> {
    return this.context.workspaces.resolve(options);
  }
}
