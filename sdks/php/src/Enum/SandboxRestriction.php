<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum SandboxRestriction: string
{
    case ConnectChannel = 'connect_channel';
    case Publish = 'publish';
    case InviteMember = 'invite_member';
    case CreateWorkspace = 'create_workspace';
    case GenerateContent = 'generate_content';
    case AddProducts = 'add_products';
}
