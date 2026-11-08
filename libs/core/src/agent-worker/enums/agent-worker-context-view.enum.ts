/** Where in the app the person opened Agent Worker from, for context. */
export enum AgentWorkerContextView {
  /** The account's channel map: every store. */
  ChannelMap = 'channel_map',
  /** One product's channel map. */
  ProductMap = 'product_map',
  Products = 'products',
  Listings = 'listings',
  Orders = 'orders',
  Inventory = 'inventory',
}
