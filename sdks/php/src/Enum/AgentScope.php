<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum AgentScope: string
{
    case CatalogRead = 'catalog:read';
    case CatalogWrite = 'catalog:write';
    case OrdersRead = 'orders:read';
    case StoresWrite = 'stores:write';
    case ReportsRead = 'reports:read';
    case SuggestionsWrite = 'suggestions:write';
    case WebhooksWrite = 'webhooks:write';
}
