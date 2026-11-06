from enum import StrEnum


class WorkspacePermission(StrEnum):
    ACTIVITYVIEW = "activity:view"
    AIGENERATE = "ai:generate"
    API_KEYSMANAGE = "api-keys:manage"
    BILLINGVIEW = "billing:view"
    CHANNELSMANAGE = "channels:manage"
    CHANNELSVIEW = "channels:view"
    INVENTORYEDIT = "inventory:edit"
    INVENTORYVIEW = "inventory:view"
    LISTINGSEDIT = "listings:edit"
    MEMBERSMANAGE = "members:manage"
    MEMBERSVIEW = "members:view"
    ORDERSVIEW = "orders:view"
    PRODUCTSEDIT = "products:edit"
    PRODUCTSVIEW = "products:view"
    REPORTSVIEW = "reports:view"
    SUGGESTIONSAPPROVE = "suggestions:approve"
    SUGGESTIONSVIEW = "suggestions:view"
    WEBHOOKSMANAGE = "webhooks:manage"
    WORKSPACEDELETE = "workspace:delete"
    WORKSPACEMANAGE = "workspace:manage"
    WORKSPACEVIEW = "workspace:view"

    def __str__(self) -> str:
        return str(self.value)
