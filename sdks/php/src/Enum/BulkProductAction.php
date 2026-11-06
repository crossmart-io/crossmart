<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum BulkProductAction: string
{
    case SetStatus = 'set_status';
    case AddTags = 'add_tags';
    case RemoveTags = 'remove_tags';
    case AdjustPrices = 'adjust_prices';
    case Delete = 'delete';
}
