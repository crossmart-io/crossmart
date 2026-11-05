/**
 * What happened. Stored as text, so a feature adds an action here (and its summary in
 * `activity-summary.ts`) without a migration.
 */
export enum ActivityAction {
  ProductCreated = 'product_created',
  ProductUpdated = 'product_updated',
  ProductDeleted = 'product_deleted',
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
  /** The detail names the previous name. */
  WorkspaceRenamed = 'workspace_renamed',
  /** The detail names the new time zone. */
  WorkspaceTimeZoneChanged = 'workspace_time_zone_changed',
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
  /** The merchant asked to publish the selected products and sync the rest. */
  ChannelSyncRequested = 'channel_sync_requested',
  /** An order took more units than were left: they were sold twice and need resolving. */
  StockOversold = 'stock_oversold',
}
