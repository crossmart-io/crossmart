from enum import StrEnum


class OrderStatus(StrEnum):
    CANCELLED = "CANCELLED"
    FULFILLED = "FULFILLED"
    OPEN = "OPEN"
    PARTIALLY_FULFILLED = "PARTIALLY_FULFILLED"

    def __str__(self) -> str:
        return str(self.value)
