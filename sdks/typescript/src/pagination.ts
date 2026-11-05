/** One page of a list endpoint. Every list in the API pages the same way. */
export interface Page<Item> {
  items: Item[];
  /** Pass as `cursor` to read the next page; `null` on the last page. */
  nextCursor: string | null;
  /** How many items match the query in all. */
  total: number;
}

/** Reads the page that starts at `cursor` (the first page when it is undefined). */
export type PageFetcher<Item> = (cursor: string | undefined) => Promise<Page<Item>>;

/**
 * Iterates over every item of a list, fetching pages lazily as the loop consumes them. Breaking
 * out of the loop stops fetching.
 *
 * @example
 * ```ts
 * for await (const product of crossmart.products.listAll({ status: ProductStatus.ACTIVE })) {
 *   console.log(product.title);
 * }
 * ```
 */
export async function* paginate<Item>(fetchPage: PageFetcher<Item>): AsyncGenerator<Item, void> {
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    yield* page.items;
    cursor = page.nextCursor ?? undefined;
  } while (cursor !== undefined);
}
