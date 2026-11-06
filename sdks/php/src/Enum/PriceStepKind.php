<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum PriceStepKind: string
{
    case Base = 'base';
    case Conversion = 'conversion';
    case Percent = 'percent';
    case FixedAmount = 'fixed_amount';
    case Rounding = 'rounding';
    case Floor = 'floor';
    case Override = 'override';
}
