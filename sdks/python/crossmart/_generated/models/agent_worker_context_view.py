from enum import StrEnum


class AgentWorkerContextView(StrEnum):
    CHANNEL_MAP = "channel_map"
    INVENTORY = "inventory"
    LISTINGS = "listings"
    ORDERS = "orders"
    PRODUCTS = "products"
    PRODUCT_MAP = "product_map"

    def __str__(self) -> str:
        return str(self.value)
