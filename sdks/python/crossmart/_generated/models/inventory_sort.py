from enum import StrEnum


class InventorySort(StrEnum):
    AVAILABLE = "available"
    TITLE = "title"
    UPDATED_AT = "updated_at"

    def __str__(self) -> str:
        return str(self.value)
