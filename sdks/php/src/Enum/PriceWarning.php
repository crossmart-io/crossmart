<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum PriceWarning: string
{
    case MissingCost = 'missing_cost';
    case BelowFloor = 'below_floor';
    case CompareAtDropped = 'compare_at_dropped';
    case ClampedToZero = 'clamped_to_zero';
    case NoExchangeRate = 'no_exchange_rate';
}
