<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum OutOfStockPolicy: string
{
    case StopSelling = 'STOP_SELLING';
    case ContinueSelling = 'CONTINUE_SELLING';
}
