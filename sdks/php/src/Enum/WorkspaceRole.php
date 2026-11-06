<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * Your role here
 */
enum WorkspaceRole: string
{
    case Owner = 'OWNER';
    case Admin = 'ADMIN';
    case Editor = 'EDITOR';
    case Approver = 'APPROVER';
    case Viewer = 'VIEWER';
    case Custom = 'CUSTOM';
}
