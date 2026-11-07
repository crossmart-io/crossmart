<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AgentWorkerTurnStatus: string
{
    case Running = 'running';
    case Completed = 'completed';
    case AwaitingApproval = 'awaiting_approval';
    case Cancelled = 'cancelled';
    case Failed = 'failed';
}
