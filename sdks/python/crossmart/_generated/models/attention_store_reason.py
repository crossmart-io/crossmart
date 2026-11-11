from enum import StrEnum


class AttentionStoreReason(StrEnum):
    DISCONNECTED_WITH_LISTINGS = "disconnected_with_listings"
    ERROR = "error"
    NEEDS_REAUTH = "needs_reauth"

    def __str__(self) -> str:
        return str(self.value)
