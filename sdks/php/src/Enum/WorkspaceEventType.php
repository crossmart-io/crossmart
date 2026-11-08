<?php

declare(strict_types=1);

// Generated from the Crossmart OpenAPI document by scripts/generate.php. Do not edit.

namespace Crossmart\Enum;

enum WorkspaceEventType: string
{
    case AgentToolCalled = 'agent.tool_called';
    case AgentChangeProposed = 'agent.change_proposed';
    case AgentChangeApproved = 'agent.change_approved';
    case AgentChangeRejected = 'agent.change_rejected';
    case AgentChangeApplied = 'agent.change_applied';
    case AgentChangeFailed = 'agent.change_failed';
    case AgentTurnFailed = 'agent.turn_failed';
    case AgentProposalReceived = 'agent.proposal_received';
    case AgentProposalApproved = 'agent.proposal_approved';
    case AgentProposalRejected = 'agent.proposal_rejected';
    case AgentProposalExpired = 'agent.proposal_expired';
    case AgentProposalFailed = 'agent.proposal_failed';
    case AgentActivity = 'agent.activity';
    case ListingPublished = 'listing.published';
    case ListingUpdated = 'listing.updated';
    case ListingFailed = 'listing.failed';
    case ListingDelisted = 'listing.delisted';
    case StockReconciled = 'stock.reconciled';
    case StockSyncFailed = 'stock.sync_failed';
    case StockOversold = 'stock.oversold';
    case OrderReceived = 'order.received';
    case StoreConnected = 'store.connected';
    case StoreDisconnected = 'store.disconnected';
    case StoreConnectFailed = 'store.connect_failed';
    case WebhookDeliveryFailed = 'webhook.delivery_failed';
    case WebhookEndpointDisabled = 'webhook.endpoint_disabled';
    case WorkspaceChange = 'workspace.change';
}
