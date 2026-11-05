/**
 * Background job queues, declared in priority order:
 * inventory updates must never wait behind content or import work.
 */
export enum QueueName {
  Inventory = 'inventory',
  Orders = 'orders',
  Price = 'price',
  Content = 'content',
  Import = 'import',
  /** AI agent jobs, such as content generation. Slow and metered, so they come last. */
  Ai = 'ai',
}
