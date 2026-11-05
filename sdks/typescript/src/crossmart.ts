import createClient from 'openapi-fetch';
import { DEFAULT_BASE_URL } from './crossmart.constants.js';
import type { paths } from './generated/schema.js';
import { authHeaders } from './http/auth-headers.js';
import { RetryPolicy } from './http/retry-policy.js';
import { createRetryingFetch, type FetchRequest } from './http/retrying-fetch.js';
import type { CrossmartCredentials, CrossmartOptions } from './options.js';
import { AiResource } from './resources/ai.resource.js';
import { InventoryResource } from './resources/inventory.resource.js';
import { ListingsResource } from './resources/listings.resource.js';
import { OrdersResource } from './resources/orders.resource.js';
import { ProductsResource } from './resources/products.resource.js';
import { ReportsResource } from './resources/reports.resource.js';
import type { CrossmartHttpClient, ResourceContext } from './resources/resource.js';
import { StoresResource } from './resources/stores.resource.js';
import { SuggestionsResource } from './resources/suggestions.resource.js';
import { WorkspacesResource } from './resources/workspaces.resource.js';
import { type WorkspaceDiscovery, WorkspaceResolver } from './workspace-resolver.js';

/**
 * The Crossmart API client.
 *
 * Every method acts on one workspace: the `workspaceId` passed to the method, else the one
 * passed here, else (with an API key) the key's own workspace.
 *
 * @example
 * ```ts
 * import { Crossmart } from '@crossmart/sdk';
 *
 * const crossmart = new Crossmart({ apiKey: process.env.CROSSMART_API_KEY! });
 * const { items } = await crossmart.products.list({ limit: 10 });
 * ```
 *
 * @example
 * ```ts
 * // An AI agent or app with an OAuth access token, against a self-hosted server
 * const crossmart = new Crossmart(
 *   { accessToken },
 *   { baseUrl: 'http://localhost:3000', workspaceId },
 * );
 * ```
 */
export class Crossmart {
  /** The typed `openapi-fetch` client, for endpoints the resources do not cover. */
  readonly http: CrossmartHttpClient;

  readonly products: ProductsResource;
  readonly inventory: InventoryResource;
  readonly stores: StoresResource;
  readonly listings: ListingsResource;
  readonly orders: OrdersResource;
  readonly reports: ReportsResource;
  readonly ai: AiResource;
  readonly suggestions: SuggestionsResource;
  readonly workspaces: WorkspacesResource;

  constructor(credentials: CrossmartCredentials, options: CrossmartOptions = {}) {
    this.http = createHttpClient(credentials, options);
    const context = this.context(credentials, options);
    this.workspaces = new WorkspacesResource(context);
    this.products = new ProductsResource(context);
    this.inventory = new InventoryResource(context);
    this.stores = new StoresResource(context);
    this.listings = new ListingsResource(context);
    this.orders = new OrdersResource(context);
    this.reports = new ReportsResource(context);
    this.ai = new AiResource(context);
    this.suggestions = new SuggestionsResource(context);
  }

  private context(credentials: CrossmartCredentials, options: CrossmartOptions): ResourceContext {
    const workspaces = new WorkspaceResolver(options.workspaceId, this.discovery(credentials));
    return { http: this.http, workspaces };
  }

  /** An API key belongs to one workspace, which the API reports. A token cannot say. */
  private discovery(credentials: CrossmartCredentials): WorkspaceDiscovery | undefined {
    if (credentials.apiKey === undefined) {
      return undefined;
    }
    return async () => (await this.workspaces.currentApiKey()).workspaceId;
  }
}

function createHttpClient(
  credentials: CrossmartCredentials,
  options: CrossmartOptions,
): CrossmartHttpClient {
  const baseFetch = options.fetch ?? globalThis.fetch;
  const fetchRequest: FetchRequest = (request) => baseFetch(request);
  return createClient<paths>({
    baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
    headers: authHeaders(credentials),
    fetch: createRetryingFetch(fetchRequest, new RetryPolicy(options.retry)),
  });
}
