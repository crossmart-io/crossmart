<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * SUCCEEDED: the endpoint answered 2xx. FAILED: anything else, or no answer.
 */
enum WebhookAttemptOutcome: string
{
    case Succeeded = 'SUCCEEDED';
    case Failed = 'FAILED';
}
