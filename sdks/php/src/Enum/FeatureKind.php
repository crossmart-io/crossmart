<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * A counted limit, or a flag the plan turns on or off
 */
enum FeatureKind: string
{
    case Limit = 'limit';
    case Flag = 'flag';
}
