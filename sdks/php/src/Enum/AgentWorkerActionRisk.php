<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * Why approving it also needs `confirmHighRisk`; empty for ordinary changes
 */
enum AgentWorkerActionRisk: string
{
    case Destructive = 'destructive';
    case PriceChange = 'price_change';
    case Bulk = 'bulk';
}
