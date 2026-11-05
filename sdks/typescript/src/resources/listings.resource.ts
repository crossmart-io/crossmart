import { MAX_PAGE_SIZE } from '../crossmart.constants.js';
import { unwrap } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import { type Page, paginate } from '../pagination.js';
import type {
  ListAllListingsQuery,
  ListListingsQuery,
  Listing,
  ListingOverrideInput,
  ProductChannel,
  StoreProductsResult,
} from '../types.js';
import { Resource } from './resource.js';

const PRODUCT_CHANNELS_PATH = '/api/v1/workspaces/{workspaceId}/products/{productId}/channels';
const PRODUCT_CHANNEL_PATH =
  '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}';
const OVERRIDE_PATH =
  '/api/v1/workspaces/{workspaceId}/products/{productId}/channels/{connectionId}/override';
const STORE_LISTINGS_PATH =
  '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/listings';
const STORE_PRODUCTS_ADD_PATH =
  '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/products/add';
const STORE_PRODUCTS_REMOVE_PATH =
  '/api/v1/workspaces/{workspaceId}/channel-connections/{connectionId}/products/remove';

/**
 * Products on stores: publishing, removing, per-store overrides and listing status. Publishing
 * is asynchronous: a new listing is `PENDING` until the store accepts it (`ACTIVE`) or rejects
 * it (`ERROR`, with the store's message in `lastError`). Reading needs `channels:view`;
 * changes need `listings:edit`.
 */
export class ListingsResource extends Resource {
  /**
   * The product on every store: whether it is selected, its listing and status, its override,
   * and each variant's price and stock there.
   *
   * @example
   * ```ts
   * const channels = await crossmart.listings.forProduct(productId);
   * for (const channel of channels) {
   *   console.log(channel.connection.displayName, channel.listing?.status, channel.listing?.lastError);
   * }
   * ```
   */
  async forProduct(productId: string, options?: RequestOptions): Promise<ProductChannel[]> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(PRODUCT_CHANNELS_PATH, {
        params: { path: { workspaceId, productId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Adds a product to a store. It is published there in the background and stays in the store
   * until it is removed, whatever the store's automatic selection rule says.
   *
   * @example
   * ```ts
   * const channel = await crossmart.listings.publish(productId, connectionId);
   * console.log(channel.listing?.status); // PENDING until the store confirms it
   * ```
   */
  async publish(
    productId: string,
    connectionId: string,
    options?: RequestOptions,
  ): Promise<ProductChannel> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(PRODUCT_CHANNEL_PATH, {
        params: { path: { workspaceId, productId, connectionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Removes a product from a store: it is delisted there, and the automatic rule leaves it out.
   *
   * @example
   * ```ts
   * await crossmart.listings.remove(productId, connectionId);
   * ```
   */
  async remove(
    productId: string,
    connectionId: string,
    options?: RequestOptions,
  ): Promise<ProductChannel> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.DELETE(PRODUCT_CHANNEL_PATH, {
        params: { path: { workspaceId, productId, connectionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Adds several products to a store at once.
   *
   * @example
   * ```ts
   * const { count } = await crossmart.listings.publishMany(connectionId, [firstId, secondId]);
   * ```
   */
  async publishMany(
    connectionId: string,
    productIds: string[],
    options?: RequestOptions,
  ): Promise<StoreProductsResult> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(STORE_PRODUCTS_ADD_PATH, {
        params: { path: { workspaceId, connectionId } },
        body: { productIds },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Removes several products from a store at once.
   *
   * @example
   * ```ts
   * const { count } = await crossmart.listings.removeMany(connectionId, [firstId, secondId]);
   * ```
   */
  async removeMany(
    connectionId: string,
    productIds: string[],
    options?: RequestOptions,
  ): Promise<StoreProductsResult> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(STORE_PRODUCTS_REMOVE_PATH, {
        params: { path: { workspaceId, connectionId } },
        body: { productIds },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Sets what the product shows differently on one store: title, description, tags, images,
   * visibility, stock buffer and cap, and fixed prices per variant. It replaces the previous
   * override; fields left out or `null` follow the product. A listed product is updated.
   *
   * @example
   * ```ts
   * await crossmart.listings.setOverride(productId, connectionId, {
   *   title: 'Handmade ceramic mug | 350 ml',
   *   variantPrices: [{ variantId, price: '21.00', compareAtPrice: null }],
   * });
   * ```
   */
  async setOverride(
    productId: string,
    connectionId: string,
    override: ListingOverrideInput,
    options?: RequestOptions,
  ): Promise<ProductChannel> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.PUT(OVERRIDE_PATH, {
        params: { path: { workspaceId, productId, connectionId } },
        body: override,
        signal: options?.signal,
      }),
    );
  }

  /**
   * Removes the product's override on one store, so it shows the catalog values again.
   *
   * @example
   * ```ts
   * await crossmart.listings.clearOverride(productId, connectionId);
   * ```
   */
  async clearOverride(
    productId: string,
    connectionId: string,
    options?: RequestOptions,
  ): Promise<ProductChannel> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.DELETE(OVERRIDE_PATH, {
        params: { path: { workspaceId, productId, connectionId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * One page of a store's listings, most recently changed first.
   *
   * @example
   * ```ts
   * const failed = await crossmart.listings.list(connectionId, { status: ListingStatus.ERROR });
   * ```
   */
  async list(
    connectionId: string,
    query: ListListingsQuery = {},
    options?: RequestOptions,
  ): Promise<Page<Listing>> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(STORE_LISTINGS_PATH, {
        params: { path: { workspaceId, connectionId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Every listing of a store that matches `query`.
   *
   * @example
   * ```ts
   * for await (const listing of crossmart.listings.listAll(connectionId)) {
   *   console.log(listing.productTitle, listing.status, listing.externalUrl);
   * }
   * ```
   */
  listAll(
    connectionId: string,
    query: ListAllListingsQuery = {},
    options?: RequestOptions,
  ): AsyncGenerator<Listing, void> {
    return paginate((cursor) =>
      this.list(connectionId, { limit: MAX_PAGE_SIZE, ...query, cursor }, options),
    );
  }
}
