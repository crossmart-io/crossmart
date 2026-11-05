from enum import StrEnum


class ProductSort(StrEnum):
    CREATEDAT = "createdAt"
    TITLE = "title"
    UPDATEDAT = "updatedAt"

    def __str__(self) -> str:
        return str(self.value)
