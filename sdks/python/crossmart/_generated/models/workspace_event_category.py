from enum import StrEnum


class WorkspaceEventCategory(StrEnum):
    AGENT = "agent"
    ORDERS = "orders"
    STORES = "stores"
    WORKSPACE = "workspace"

    def __str__(self) -> str:
        return str(self.value)
