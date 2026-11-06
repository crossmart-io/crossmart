import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import type {
  PricingPreview,
  PricingPreviewInput,
  PricingRule,
  Store,
  SyncProgress,
  SyncRequestResult,
} from '../types.js';
import { Resource } from './resource.js';

const STORES_PATH = '/api/v1/workspaces/{workspaceId}/channel-connections';
const STORE_PATH = '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}';
const PRICING_PATH = '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/pricing';
const PRICING_PREVIEW_PATH =
  '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/pricing/preview';
const SYNC_PATH = '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/sync';

/**
 * Stores: the workspace's connections to sales channels (Shopify, eBay, Google Merchant…).
 * A store's `id` is the `connectionId` other methods take. Connecting a store needs the
 * merchant's consent, so it happens in the dashboard, not through the API.
 * Reading needs `channels:view`; pricing and sync need `channels:manage`.
 */
export class StoresResource extends Resource {
  /**
   * Every store of the workspace, with its status, pricing rule and failed listing count.
   *
   * @example
   * ```ts
   * const stores = await crossmart.stores.list();
   * const shopify = stores.find(
   *   (store) => store.channel === ChannelType.shopify && store.status === ChannelConnectionStatus.CONNECTED,
   * );
   * ```
   */
  async list(options?: RequestOptions): Promise<Store[]> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(STORES_PATH, { params: { path: { workspaceId } }, signal: options?.signal }),
    );
  }

  /**
   * One store.
   *
   * @example
   * ```ts
   * const store = await crossmart.stores.get(connectionId);
   * console.log(store.displayName, store.status);
   * ```
   */
  async get(connectionId: string, options?: RequestOptions): Promise<Store> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(STORE_PATH, {
        params: { path: { workspaceId, connectionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Sets the store's pricing rule: how catalog prices become this store's prices (markup or
   * discount, a fixed amount, rounding, a floor). Listed products are repriced.
   *
   * @example
   * ```ts
   * await crossmart.stores.updatePricing(connectionId, {
   *   adjustmentPercent: '10',
   *   fixedAmount: '0',
   *   rounding: PriceRounding.ending_99,
   *   floor: null,
   *   compareAt: CompareAtMode.adjust,
   * });
   * ```
   */
  async updatePricing(
    connectionId: string,
    rule: PricingRule,
    options?: RequestOptions,
  ): Promise<Store> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.PUT(PRICING_PATH, {
        params: { path: { workspaceId, connectionId } },
        body: { rule },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Prices a real product with a rule, saved or not, without changing anything.
   *
   * @example
   * ```ts
   * const preview = await crossmart.stores.previewPricing(connectionId, { rule, productId });
   * ```
   */
  async previewPricing(
    connectionId: string,
    input: PricingPreviewInput,
    options?: RequestOptions,
  ): Promise<PricingPreview> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(PRICING_PREVIEW_PATH, {
        params: { path: { workspaceId, connectionId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }

  /**
   * Publishes the store's selected products and updates what changed, in the background.
   *
   * @example
   * ```ts
   * const { queued, delisting } = await crossmart.stores.sync(connectionId);
   * ```
   */
  async sync(connectionId: string, options?: RequestOptions): Promise<SyncRequestResult> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(SYNC_PATH, {
        params: { path: { workspaceId, connectionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * How far the store's sync has come: listings a sync or retry queued whose job has not finished
   * (`pending`), listings in error (`failed`), and whether nothing is left (`done`).
   *
   * @example
   * ```ts
   * const { queued, delisting } = await crossmart.stores.sync(connectionId);
   * const { pending, done } = await crossmart.stores.syncProgress(connectionId);
   * console.log(`${queued + delisting - pending} of ${queued + delisting} done`, done);
   * ```
   */
  async syncProgress(connectionId: string, options?: RequestOptions): Promise<SyncProgress> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(SYNC_PATH, {
        params: { path: { workspaceId, connectionId } },
        signal: options?.signal,
      }),
    );
  }
}
