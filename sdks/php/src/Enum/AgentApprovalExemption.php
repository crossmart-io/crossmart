<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * Set with `apply_directly` when the workspace approves agents’ changes but this call needs none: `new_draft` for `create_product` with no status or DRAFT. Null otherwise.
 */
enum AgentApprovalExemption: string
{
    case NewDraft = 'new_draft';
}
