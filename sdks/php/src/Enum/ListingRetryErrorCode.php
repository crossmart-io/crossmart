<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `store_not_connected`: the store needs re-auth, was disconnected or is in error; reconnect it. `product_not_in_store`: the store does not select the product; add it.
 */
enum ListingRetryErrorCode: string
{
    case StoreNotConnected = 'store_not_connected';
    case ProductNotInStore = 'product_not_in_store';
}
