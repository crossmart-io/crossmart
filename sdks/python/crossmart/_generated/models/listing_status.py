from enum import StrEnum


class ListingStatus(StrEnum):
    ACTIVE = "ACTIVE"
    DELISTED = "DELISTED"
    ERROR = "ERROR"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"

    def __str__(self) -> str:
        return str(self.value)
