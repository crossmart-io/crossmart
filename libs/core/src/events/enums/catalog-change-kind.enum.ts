/** What about a product changed, so listeners sync only that part to channels. */
export enum CatalogChangeKind {
  /** Title, description, images, tags, status, options or variants. */
  Content = 'content',
  /** Prices or costs only. */
  Price = 'price',
  /** Stock levels. */
  Stock = 'stock',
}
