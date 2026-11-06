<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * What the connection cannot do until the merchant approves the app again
 */
enum ChannelFeature: string
{
    case StorefrontVisibility = 'storefront_visibility';
    case OrderSync = 'order_sync';
}
