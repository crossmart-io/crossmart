<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum PriceSource: string
{
    case Override = 'override';
    case Rule = 'rule';
    case Base = 'base';
}
