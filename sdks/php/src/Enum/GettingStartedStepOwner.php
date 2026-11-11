<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `merchant`: only the seller can take it, in the app; `agent`: with `tools`
 */
enum GettingStartedStepOwner: string
{
    case Merchant = 'merchant';
    case Agent = 'agent';
}
