/**
 * What happened. Stored as text, so a feature adds an action here (and its summary in
 * `activity-summary.ts`) without a migration.
 */
export enum ActivityAction {
  ProductCreated = 'product_created',
  ProductUpdated = 'product_updated',
  ProductDeleted = 'product_deleted',
  /**
   * A product was marked sold: its available stock went to 0, counted by `itemCount`, and it was
   * taken off every store (each removal is logged on its own).
   */
  ProductMarkedSold = 'product_marked_sold',
  ProductsBulkUpdated = 'products_bulk_updated',
  ProductsBulkDeleted = 'products_bulk_deleted',
  /** A create import: new products from a file. */
  ProductsImported = 'products_imported',
  /** An update import: catalog products replaced from a file. */
  ProductsUpdatedByImport = 'products_updated_by_import',
  /** An inventory import: stock levels set from a file. */
  StockImported = 'stock_imported',
  /** A channel import: products created or linked from a connected store's catalog. */
  ChannelCatalogImported = 'channel_catalog_imported',
  ProductViewCreated = 'product_view_created',
  ProductViewDeleted = 'product_view_deleted',
  ApiKeyCreated = 'api_key_created',
  ApiKeyRevoked = 'api_key_revoked',
  /** A webhook endpoint was added; the subject is labelled with its URL. */
  WebhookEndpointCreated = 'webhook_endpoint_created',
  /** A webhook endpoint's URL, events or description changed, or it was turned on or off. */
  WebhookEndpointUpdated = 'webhook_endpoint_updated',
  WebhookEndpointDeleted = 'webhook_endpoint_deleted',
  /** A webhook endpoint got a new signing secret. */
  WebhookSecretRotated = 'webhook_secret_rotated',
  /** Crossmart turned a webhook endpoint off after too many failed deliveries in a row. */
  WebhookEndpointDisabled = 'webhook_endpoint_disabled',
  /** An AI agent's OAuth connection to the workspace was revoked. */
  AgentDisconnected = 'agent_disconnected',
  /**
   * Agents that once worked in the workspace were deleted after going unused (ADR 0019): one
   * event per sweep, counting them, with their names as the detail.
   */
  UnusedAgentsRemoved = 'unused_agents_removed',
  /** Someone was invited by email; the subject is the invitation, labelled with the address. */
  MemberInvited = 'member_invited',
  InvitationRevoked = 'invitation_revoked',
  /** An invitation was accepted; the actor is the new member. */
  MemberJoined = 'member_joined',
  /** The detail names the new role. */
  MemberRoleChanged = 'member_role_changed',
  MemberRemoved = 'member_removed',
  /** A member removed themselves. */
  MemberLeft = 'member_left',
  WorkspaceCreated = 'workspace_created',
  /**
   * An AI agent opened the account as a sandbox for someone without one (ADR 0019); the actor is
   * the API key it was given, and the detail the address the claim link went to.
   */
  SandboxCreated = 'sandbox_created',
  /** The owner claimed the sandbox account, which is a normal workspace from then on. */
  SandboxClaimed = 'sandbox_claimed',
  /** The detail names the previous name. */
  WorkspaceRenamed = 'workspace_renamed',
  /** The detail names the new time zone. */
  WorkspaceTimeZoneChanged = 'workspace_time_zone_changed',
  /**
   * Whether outside agents' changes wait for approval changed (ADR 0028); the detail says what
   * it is now.
   */
  OutsideAgentChangesChanged = 'outside_agent_changes_changed',
  CustomRoleCreated = 'custom_role_created',
  /** A custom role's name or permissions changed. */
  CustomRoleUpdated = 'custom_role_updated',
  CustomRoleDeleted = 'custom_role_deleted',
  InventoryAdjusted = 'inventory_adjusted',
  /** A channel account (a Shopify store) was connected, or connected again. */
  ChannelConnected = 'channel_connected',
  /** By the merchant, or by the channel when the app was uninstalled. */
  ChannelDisconnected = 'channel_disconnected',
  ChannelConnectFailed = 'channel_connect_failed',
  /** A product was published to a channel for the first time. */
  ListingPublished = 'listing_published',
  /** A listing was updated with the product's current content. */
  ListingUpdated = 'listing_updated',
  /** Publishing or updating a listing failed; the listing shows why. */
  ListingSyncFailed = 'listing_sync_failed',
  /** A listing was taken off its channel, as the product is no longer selected. */
  ListingDelisted = 'listing_delisted',
  /** The merchant added a product to a store by hand; it is published there. */
  ListingAdded = 'listing_added',
  /** The merchant removed a product from a store by hand; it is delisted there. */
  ListingRemoved = 'listing_removed',
  /** The merchant changed what one listing shows differently from the product. */
  ListingOverrideUpdated = 'listing_override_updated',
  ChannelPricingUpdated = 'channel_pricing_updated',
  ChannelSelectionUpdated = 'channel_selection_updated',
  /** The merchant changed an eBay connection's listing defaults (policies, condition, ship-from). */
  ChannelListingDefaultsUpdated = 'channel_listing_defaults_updated',
  /** The merchant opted an eBay account in to business policies. */
  ChannelPoliciesOptedIn = 'channel_policies_opted_in',
  /** The merchant had Crossmart create default business policies on an eBay account. */
  ChannelDefaultPoliciesCreated = 'channel_default_policies_created',
  /** The merchant chose the channel category one listing goes in; the detail names the store. */
  ListingCategoryChanged = 'listing_category_changed',
  /** The merchant set the item specifics of one listing; the detail names the store. */
  ListingItemSpecificsChanged = 'listing_item_specifics_changed',
  /** The merchant asked to publish the selected products and sync the rest. */
  ChannelSyncRequested = 'channel_sync_requested',
  /** The merchant asked to publish one product to one store again; the detail names the store. */
  ListingRetryRequested = 'listing_retry_requested',
  /**
   * Stock reconciliation found a store showing the wrong quantity for some of a product's items
   * and corrected them; the detail names the store and the count says how many items.
   */
  StockReconciled = 'stock_reconciled',
  /** A store refused some of a product's stock levels; the listing shows why. */
  StockSyncFailed = 'stock_sync_failed',
  /** An order took more units than were left: they were sold twice and need resolving. */
  StockOversold = 'stock_oversold',
  /** Someone asked the Content Generator for channel content; the detail names the store. */
  ContentGenerationRequested = 'content_generation_requested',
  /** The Content Generator suggested content for one product; the detail names the store. */
  ContentGenerated = 'content_generated',
  /** A suggestion was approved and applied; the detail names the field and the store. */
  SuggestionApproved = 'suggestion_approved',
  /** A suggestion was rejected; the detail names the field and the store. */
  SuggestionRejected = 'suggestion_rejected',
  /**
   * A person rejected an outside agent's proposed change (ADR 0028); the detail names the agent.
   * Approved ones need no event of their own: the change is logged, credited to the agent and
   * the person who approved it.
   */
  AgentProposalRejected = 'agent_proposal_rejected',
  /** Several suggestions were approved at once; each applied change is logged on its own too. */
  SuggestionsBulkApproved = 'suggestions_bulk_approved',
}
