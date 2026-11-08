<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum WorkspaceEventCategory: string
{
    case Agent = 'agent';
    case Stores = 'stores';
    case Orders = 'orders';
    case Workspace = 'workspace';
}
