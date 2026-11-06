<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum SuggestionStatus: string
{
    case Pending = 'PENDING';
    case Applied = 'APPLIED';
    case Rejected = 'REJECTED';
    case Stale = 'STALE';
}
