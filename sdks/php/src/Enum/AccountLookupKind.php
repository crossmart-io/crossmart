<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AccountLookupKind: string
{
    case ListingStatus = 'listing_status';
    case PlanUsage = 'plan_usage';
    case ChannelConnections = 'channel_connections';
    case FailedListings = 'failed_listings';
}
