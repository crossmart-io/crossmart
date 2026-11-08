<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * What happens to changes by outside AI agents (OAuth agents and MCP sessions): `require_approval` (the default) makes each one a proposal to approve; `apply_directly` makes them at once. API keys over REST always apply directly.
 */
enum OutsideAgentChanges: string
{
    case RequireApproval = 'require_approval';
    case ApplyDirectly = 'apply_directly';
}
