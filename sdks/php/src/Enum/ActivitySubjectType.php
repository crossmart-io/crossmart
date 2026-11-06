<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum ActivitySubjectType: string
{
    case Product = 'product';
    case ProductView = 'product_view';
    case ImportJob = 'import_job';
    case ApiKey = 'api_key';
    case AgentConnection = 'agent_connection';
    case Member = 'member';
    case Invitation = 'invitation';
    case Workspace = 'workspace';
    case CustomRole = 'custom_role';
    case ChannelConnection = 'channel_connection';
    case WebhookEndpoint = 'webhook_endpoint';
}
