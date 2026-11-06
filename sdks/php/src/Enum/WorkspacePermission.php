<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

/**
 * What your role lets you do here. Check these, not the role, to adapt a UI.
 */
enum WorkspacePermission: string
{
    case WorkspaceView = 'workspace:view';
    case WorkspaceManage = 'workspace:manage';
    case WorkspaceDelete = 'workspace:delete';
    case MembersView = 'members:view';
    case MembersManage = 'members:manage';
    case ApiKeysManage = 'api-keys:manage';
    case WebhooksManage = 'webhooks:manage';
    case ProductsView = 'products:view';
    case ProductsEdit = 'products:edit';
    case InventoryView = 'inventory:view';
    case InventoryEdit = 'inventory:edit';
    case OrdersView = 'orders:view';
    case ReportsView = 'reports:view';
    case ChannelsView = 'channels:view';
    case ChannelsManage = 'channels:manage';
    case ListingsEdit = 'listings:edit';
    case ActivityView = 'activity:view';
    case SuggestionsView = 'suggestions:view';
    case SuggestionsApprove = 'suggestions:approve';
    case BillingView = 'billing:view';
    case AiGenerate = 'ai:generate';
}
