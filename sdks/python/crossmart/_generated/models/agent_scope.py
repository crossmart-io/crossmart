from enum import StrEnum


class AgentScope(StrEnum):
    CATALOGREAD = "catalog:read"
    CATALOGWRITE = "catalog:write"
    ORDERSREAD = "orders:read"
    REPORTSREAD = "reports:read"
    STORESWRITE = "stores:write"
    SUGGESTIONSWRITE = "suggestions:write"
    WEBHOOKSWRITE = "webhooks:write"

    def __str__(self) -> str:
        return str(self.value)
