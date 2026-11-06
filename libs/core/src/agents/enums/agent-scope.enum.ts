/**
 * What a user lets a connected AI agent do in one workspace (ADR 0019). A call is allowed only
 * when the agent's scopes and the user's own role both allow it.
 */
export enum AgentScope {
  /** Products, stock, stores, listings and AI suggestions, without changing them. */
  CatalogRead = 'catalog:read',
  /** Create and change products, prices, images and stock. */
  CatalogWrite = 'catalog:write',
  OrdersRead = 'orders:read',
  /** Add products to stores and take them off. */
  StoresWrite = 'stores:write',
  ReportsRead = 'reports:read',
  /** Ask for AI content, and approve or reject suggestions. */
  SuggestionsWrite = 'suggestions:write',
}
