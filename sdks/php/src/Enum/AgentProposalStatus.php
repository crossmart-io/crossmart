<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * A pending proposal past its expiry reads as expired
 */
enum AgentProposalStatus: string
{
    case Pending = 'pending';
    case Applying = 'applying';
    case Applied = 'applied';
    case Failed = 'failed';
    case Rejected = 'rejected';
    case Expired = 'expired';
}
