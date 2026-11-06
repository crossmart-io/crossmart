<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum OrderStatus: string
{
    case Open = 'OPEN';
    case PartiallyFulfilled = 'PARTIALLY_FULFILLED';
    case Fulfilled = 'FULFILLED';
    case Cancelled = 'CANCELLED';
}
