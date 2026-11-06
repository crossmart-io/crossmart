<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum PriceRounding: string
{
    case None = 'none';
    case Ending99 = 'ending_99';
    case Ending95 = 'ending_95';
    case Whole = 'whole';
}
