<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ListingStatus: string
{
    case Pending = 'PENDING';
    case Active = 'ACTIVE';
    case Inactive = 'INACTIVE';
    case Error = 'ERROR';
    case Delisted = 'DELISTED';
}
