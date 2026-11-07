<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * Why a person is offered; null when none is
 */
enum AskEscalationReason: string
{
    case Unanswered = 'unanswered';
    case LowConfidence = 'low_confidence';
    case HumanRequested = 'human_requested';
    case Sales = 'sales';
}
