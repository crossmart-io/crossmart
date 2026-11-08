<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `proposed`: it waits for the seller. `apply_directly`: the workspace lets agents make changes at once, so make the call itself.
 */
enum AgentProposalOutcome: string
{
    case Proposed = 'proposed';
    case ApplyDirectly = 'apply_directly';
}
