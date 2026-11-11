<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * `proposed`: it waits for the seller. `apply_directly`: make the call itself, because the workspace lets agents make changes at once or the call needs no approval (`exemption`).
 */
enum AgentProposalOutcome: string
{
    case Proposed = 'proposed';
    case ApplyDirectly = 'apply_directly';
}
