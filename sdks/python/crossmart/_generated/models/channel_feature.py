from enum import StrEnum


class ChannelFeature(StrEnum):
    ORDER_SYNC = "order_sync"
    STOREFRONT_VISIBILITY = "storefront_visibility"

    def __str__(self) -> str:
        return str(self.value)
