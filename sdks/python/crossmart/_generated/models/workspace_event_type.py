from enum import StrEnum


class WorkspaceEventType(StrEnum):
    AGENT_ACTIVITY = "agent.activity"
    AGENT_CHANGE_APPLIED = "agent.change_applied"
    AGENT_CHANGE_APPROVED = "agent.change_approved"
    AGENT_CHANGE_FAILED = "agent.change_failed"
    AGENT_CHANGE_PROPOSED = "agent.change_proposed"
    AGENT_CHANGE_REJECTED = "agent.change_rejected"
    AGENT_PROPOSAL_APPROVED = "agent.proposal_approved"
    AGENT_PROPOSAL_EXPIRED = "agent.proposal_expired"
    AGENT_PROPOSAL_FAILED = "agent.proposal_failed"
    AGENT_PROPOSAL_RECEIVED = "agent.proposal_received"
    AGENT_PROPOSAL_REJECTED = "agent.proposal_rejected"
    AGENT_TOOL_CALLED = "agent.tool_called"
    AGENT_TURN_FAILED = "agent.turn_failed"
    LISTING_DELISTED = "listing.delisted"
    LISTING_FAILED = "listing.failed"
    LISTING_PUBLISHED = "listing.published"
    LISTING_UPDATED = "listing.updated"
    ORDER_RECEIVED = "order.received"
    STOCK_OVERSOLD = "stock.oversold"
    STOCK_RECONCILED = "stock.reconciled"
    STOCK_SYNC_FAILED = "stock.sync_failed"
    STORE_CONNECTED = "store.connected"
    STORE_CONNECT_FAILED = "store.connect_failed"
    STORE_DISCONNECTED = "store.disconnected"
    WEBHOOK_DELIVERY_FAILED = "webhook.delivery_failed"
    WEBHOOK_ENDPOINT_DISABLED = "webhook.endpoint_disabled"
    WORKSPACE_CHANGE = "workspace.change"

    def __str__(self) -> str:
        return str(self.value)
