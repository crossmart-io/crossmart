<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum StockLevel: string
{
    case InStock = 'in_stock';
    case LowStock = 'low_stock';
    case OutOfStock = 'out_of_stock';
    case Untracked = 'untracked';
}
