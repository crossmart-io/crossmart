from enum import StrEnum


class AccountLookupKind(StrEnum):
    CHANNEL_CONNECTIONS = "channel_connections"
    FAILED_LISTINGS = "failed_listings"
    LISTING_STATUS = "listing_status"
    PLAN_USAGE = "plan_usage"

    def __str__(self) -> str:
        return str(self.value)
