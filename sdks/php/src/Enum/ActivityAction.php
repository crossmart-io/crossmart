<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ActivityAction: string
{
    case ProductCreated = 'product_created';
    case ProductUpdated = 'product_updated';
    case ProductDeleted = 'product_deleted';
    case ProductsBulkUpdated = 'products_bulk_updated';
    case ProductsBulkDeleted = 'products_bulk_deleted';
    case ProductsImported = 'products_imported';
    case ProductsUpdatedByImport = 'products_updated_by_import';
    case StockImported = 'stock_imported';
    case ChannelCatalogImported = 'channel_catalog_imported';
    case ProductViewCreated = 'product_view_created';
    case ProductViewDeleted = 'product_view_deleted';
    case ApiKeyCreated = 'api_key_created';
    case ApiKeyRevoked = 'api_key_revoked';
    case MemberInvited = 'member_invited';
    case InvitationRevoked = 'invitation_revoked';
    case MemberJoined = 'member_joined';
    case MemberRoleChanged = 'member_role_changed';
    case MemberRemoved = 'member_removed';
    case MemberLeft = 'member_left';
    case WorkspaceCreated = 'workspace_created';
    case WorkspaceRenamed = 'workspace_renamed';
    case WorkspaceTimeZoneChanged = 'workspace_time_zone_changed';
    case CustomRoleCreated = 'custom_role_created';
    case CustomRoleUpdated = 'custom_role_updated';
    case CustomRoleDeleted = 'custom_role_deleted';
    case InventoryAdjusted = 'inventory_adjusted';
    case ChannelConnected = 'channel_connected';
    case ChannelDisconnected = 'channel_disconnected';
    case ChannelConnectFailed = 'channel_connect_failed';
    case ListingPublished = 'listing_published';
    case ListingUpdated = 'listing_updated';
    case ListingSyncFailed = 'listing_sync_failed';
    case ListingDelisted = 'listing_delisted';
    case ListingAdded = 'listing_added';
    case ListingRemoved = 'listing_removed';
    case ListingOverrideUpdated = 'listing_override_updated';
    case ChannelPricingUpdated = 'channel_pricing_updated';
    case ChannelSelectionUpdated = 'channel_selection_updated';
    case ChannelListingDefaultsUpdated = 'channel_listing_defaults_updated';
    case ChannelPoliciesOptedIn = 'channel_policies_opted_in';
    case ChannelDefaultPoliciesCreated = 'channel_default_policies_created';
    case ListingCategoryChanged = 'listing_category_changed';
    case ListingItemSpecificsChanged = 'listing_item_specifics_changed';
    case ChannelSyncRequested = 'channel_sync_requested';
    case ListingRetryRequested = 'listing_retry_requested';
    case StockOversold = 'stock_oversold';
    case ContentGenerationRequested = 'content_generation_requested';
    case ContentGenerated = 'content_generated';
    case SuggestionApproved = 'suggestion_approved';
    case SuggestionRejected = 'suggestion_rejected';
    case SuggestionsBulkApproved = 'suggestions_bulk_approved';
}
