<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ChannelConnectionStatus: string
{
    case Connected = 'CONNECTED';
    case NeedsReauth = 'NEEDS_REAUTH';
    case Disconnected = 'DISCONNECTED';
    case Error = 'ERROR';
}
