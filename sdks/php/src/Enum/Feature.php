<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum Feature: string
{
    case ActiveListings = 'active_listings';
    case ChannelConnections = 'channel_connections';
    case Workspaces = 'workspaces';
    case Members = 'members';
    case ApiKeys = 'api_keys';
    case WebhookEndpoints = 'webhook_endpoints';
    case AiCredits = 'ai_credits';
    case AutonomousAgents = 'autonomous_agents';
    case BringYourOwnKey = 'bring_your_own_key';
}
