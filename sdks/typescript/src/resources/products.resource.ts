import { MAX_PAGE_SIZE } from '../crossmart.constants.js';
import { unwrap, unwrapEmpty } from '../http/unwrap.js';
import type { RequestOptions } from '../options.js';
import { type Page, paginate } from '../pagination.js';
import type {
  CreateProductInput,
  ListAllProductsQuery,
  ListProductsQuery,
  Product,
  ProductSummary,
  UpdateProductInput,
} from '../types.js';
import { Resource } from './resource.js';

const PRODUCTS_PATH = '/api/v1/workspaces/{workspaceId}/products';
const PRODUCT_PATH = '/api/v1/workspaces/{workspaceId}/products/{productId}';

/** The catalog: products and their variants. Needs `products:view`, and `products:edit` to write. */
export class ProductsResource extends Resource {
  /**
   * One page of products, sorted by title unless `sort` says otherwise.
   *
   * @example
   * ```ts
   * const page = await crossmart.products.list({ search: 'mug', limit: 50 });
   * console.log(page.total, page.items.map((product) => product.title));
   * const next = await crossmart.products.list({ search: 'mug', cursor: page.nextCursor ?? undefined });
   * ```
   */
  async list(
    query: ListProductsQuery = {},
    options?: RequestOptions,
  ): Promise<Page<ProductSummary>> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(PRODUCTS_PATH, {
        params: { path: { workspaceId }, query },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Every product that matches `query`, fetching pages as the loop needs them.
   *
   * @example
   * ```ts
   * for await (const product of crossmart.products.listAll({ status: ProductStatus.ACTIVE })) {
   *   console.log(product.title, product.totalAvailable);
   * }
   * ```
   */
  listAll(
    query: ListAllProductsQuery = {},
    options?: RequestOptions,
  ): AsyncGenerator<ProductSummary, void> {
    return paginate((cursor) => this.list({ limit: MAX_PAGE_SIZE, ...query, cursor }, options));
  }

  /**
   * One product with its variants, options and media.
   *
   * @example
   * ```ts
   * const product = await crossmart.products.get(productId);
   * console.log(product.variants.map((variant) => variant.sku));
   * ```
   */
  async get(productId: string, options?: RequestOptions): Promise<Product> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.GET(PRODUCT_PATH, {
        params: { path: { workspaceId, productId } },
        signal: options?.signal,
      }),
    );
  }

  /**
   * Creates a product with at least one variant. It is a draft unless `status` is `ACTIVE`.
   * Prices are decimal strings in the workspace's currency.
   *
   * @example
   * ```ts
   * const product = await crossmart.products.create({
   *   title: 'Ceramic mug',
   *   status: ProductStatus.ACTIVE,
   *   variants: [{ sku: 'MUG-01', price: '18.00', quantity: 25 }],
   * });
   * ```
   */
  async create(input: CreateProductInput, options?: RequestOptions): Promise<Product> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.POST(PRODUCTS_PATH, {
        params: { path: { workspaceId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }

  /**
   * Replaces a product (PUT). Send the whole product: variants left out are removed, a variant
   * keeps its identity through its `id`, and optional fields left out take their defaults. Read
   * it with `get()` first and send every field you want to keep. A variant's `quantity` sets its
   * available stock; leave it out to keep the stock as it is (a new variant then starts at 0).
   *
   * @example
   * ```ts
   * const product = await crossmart.products.get(productId);
   * await crossmart.products.update(productId, {
   *   title: 'Ceramic mug, 350 ml',
   *   handle: product.handle,
   *   status: product.status,
   *   descriptionHtml: product.descriptionHtml,
   *   tags: product.tags,
   *   optionNames: product.optionNames,
   *   media: product.media.map(({ url, altText }) => ({ url, altText: altText ?? undefined })),
   *   variants: product.variants.map((variant) => ({
   *     id: variant.id,
   *     sku: variant.sku ?? undefined,
   *     optionValues: variant.optionValues,
   *     price: variant.price,
   *     compareAtPrice: variant.compareAtPrice ?? undefined,
   *     tracked: variant.tracked,
   *     quantity: variant.available,
   *   })),
   * });
   * ```
   */
  async update(
    productId: string,
    input: UpdateProductInput,
    options?: RequestOptions,
  ): Promise<Product> {
    const workspaceId = await this.workspaceId(options);
    return unwrap(
      this.http.PUT(PRODUCT_PATH, {
        params: { path: { workspaceId, productId } },
        body: input,
        signal: options?.signal,
      }),
    );
  }

  /**
   * Deletes a product and its variants.
   *
   * @example
   * ```ts
   * await crossmart.products.delete(productId);
   * ```
   */
  async delete(productId: string, options?: RequestOptions): Promise<void> {
    const workspaceId = await this.workspaceId(options);
    await unwrapEmpty(
      this.http.DELETE(PRODUCT_PATH, {
        params: { path: { workspaceId, productId } },
        signal: options?.signal,
      }),
    );
  }
}
