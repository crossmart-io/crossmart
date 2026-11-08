/**
 * What happened, as the workspace event stream names it (ADR 0027). Values are part of the API:
 * add new ones, never rename one. A client shows a type it does not know by its summary.
 */
export enum WorkspaceEventType {
  /** Crossmart Agent read something; the summary says what, and the detail what it found. */
  AgentToolCalled = 'agent.tool_called',
  /** Crossmart Agent proposed a change, which waits for the person's approval. */
  AgentChangeProposed = 'agent.change_proposed',
  AgentChangeApproved = 'agent.change_approved',
  /** Rejected by the person, or dropped because they moved on. */
  AgentChangeRejected = 'agent.change_rejected',
  /** An approved change was made through the API. */
  AgentChangeApplied = 'agent.change_applied',
  /** An approved change was refused by the API, or the agent could not propose it. */
  AgentChangeFailed = 'agent.change_failed',
  /** A turn of Crossmart Agent ended in an error. */
  AgentTurnFailed = 'agent.turn_failed',
  /** An outside agent (ADR 0028) proposed a change; it waits for someone's approval. */
  AgentProposalReceived = 'agent.proposal_received',
  /** Someone approved an outside agent's proposal; the change follows as `agent.activity`. */
  AgentProposalApproved = 'agent.proposal_approved',
  AgentProposalRejected = 'agent.proposal_rejected',
  /** Nobody decided an outside agent's proposal in time. */
  AgentProposalExpired = 'agent.proposal_expired',
  /** An approved proposal was refused by the API. */
  AgentProposalFailed = 'agent.proposal_failed',
  /** Another agent (over MCP) or a program (with an API key) changed something. */
  AgentActivity = 'agent.activity',
  ListingPublished = 'listing.published',
  ListingUpdated = 'listing.updated',
  /** A store refused a listing; the detail is the store's reason. */
  ListingFailed = 'listing.failed',
  ListingDelisted = 'listing.delisted',
  /** Reconciliation corrected stock a store showed wrongly. */
  StockReconciled = 'stock.reconciled',
  /** A store refused some stock levels. */
  StockSyncFailed = 'stock.sync_failed',
  /** An order took more units than were left. */
  StockOversold = 'stock.oversold',
  OrderReceived = 'order.received',
  StoreConnected = 'store.connected',
  StoreDisconnected = 'store.disconnected',
  StoreConnectFailed = 'store.connect_failed',
  /** A webhook delivery gave up after its retries. */
  WebhookDeliveryFailed = 'webhook.delivery_failed',
  /** Crossmart turned a webhook endpoint off after too many failures. */
  WebhookEndpointDisabled = 'webhook.endpoint_disabled',
  /** Anything else someone changed, from the activity log. */
  WorkspaceChange = 'workspace.change',
}
