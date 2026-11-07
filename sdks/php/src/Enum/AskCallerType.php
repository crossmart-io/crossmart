<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AskCallerType: string
{
    case Anonymous = 'anonymous';
    case User = 'user';
    case ApiKey = 'api_key';
    case Agent = 'agent';
}
