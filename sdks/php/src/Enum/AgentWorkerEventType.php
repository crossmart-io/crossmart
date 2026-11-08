<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AgentWorkerEventType: string
{
    case TurnStarted = 'turn_started';
    case TextDelta = 'text_delta';
    case Message = 'message';
    case ToolStarted = 'tool_started';
    case ToolFinished = 'tool_finished';
    case ActionProposed = 'action_proposed';
    case ActionDecided = 'action_decided';
    case TurnFinished = 'turn_finished';
    case Error = 'error';
}
