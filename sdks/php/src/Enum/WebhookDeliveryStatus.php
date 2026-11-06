<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum WebhookDeliveryStatus: string
{
    case Pending = 'PENDING';
    case Retrying = 'RETRYING';
    case Succeeded = 'SUCCEEDED';
    case Failed = 'FAILED';
}
