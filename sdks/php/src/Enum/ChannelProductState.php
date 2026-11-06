<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ChannelProductState: string
{
    case Listed = 'listed';
    case Pending = 'pending';
    case Failed = 'failed';
    case Removing = 'removing';
    case RemovedByHand = 'removed_by_hand';
    case Excluded = 'excluded';
}
