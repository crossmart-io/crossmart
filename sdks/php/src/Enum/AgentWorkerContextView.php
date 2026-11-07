<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * The page the person wrote from
 */
enum AgentWorkerContextView: string
{
    case ChannelMap = 'channel_map';
    case ProductMap = 'product_map';
    case Products = 'products';
    case Listings = 'listings';
    case Orders = 'orders';
    case Inventory = 'inventory';
}
