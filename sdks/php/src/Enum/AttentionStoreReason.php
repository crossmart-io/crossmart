<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AttentionStoreReason: string
{
    case NeedsReauth = 'needs_reauth';
    case Error = 'error';
    case DisconnectedWithListings = 'disconnected_with_listings';
}
