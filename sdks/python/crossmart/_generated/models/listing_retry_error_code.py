from enum import StrEnum


class ListingRetryErrorCode(StrEnum):
    PRODUCT_NOT_IN_STORE = "product_not_in_store"
    STORE_NOT_CONNECTED = "store_not_connected"

    def __str__(self) -> str:
        return str(self.value)
