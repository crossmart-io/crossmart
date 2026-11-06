<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum SubscriptionStatus: string
{
    case Active = 'ACTIVE';
    case Trialing = 'TRIALING';
    case PastDue = 'PAST_DUE';
    case Canceled = 'CANCELED';
}
