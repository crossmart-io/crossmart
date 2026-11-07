<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * Where the question comes from, for Crossmart’s statistics only
 */
enum AskChannel: string
{
    case WebWidget = 'web_widget';
    case AppWidget = 'app_widget';
    case Api = 'api';
    case Mcp = 'mcp';
}
