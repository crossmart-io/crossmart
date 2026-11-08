/** The groups a client filters the event stream by. */
export enum WorkspaceEventCategory {
  /** Crossmart Agent's steps, and other agents and programs at work. */
  Agent = 'agent',
  /** Listings, stock sync and store connections. */
  Stores = 'stores',
  Orders = 'orders',
  /** Everything else: people's edits, webhooks, settings. */
  Workspace = 'workspace',
}
