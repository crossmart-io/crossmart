<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AgentWorkerActionStatus: string
{
    case Running = 'running';
    case Succeeded = 'succeeded';
    case Failed = 'failed';
    case Proposed = 'proposed';
    case Refused = 'refused';
    case Rejected = 'rejected';
    case Expired = 'expired';
    case Cancelled = 'cancelled';
    case Executing = 'executing';
    case Executed = 'executed';
    case ExecutionFailed = 'execution_failed';
}
