from enum import StrEnum


class ProductStatus(StrEnum):
    ACTIVE = "ACTIVE"
    ARCHIVED = "ARCHIVED"
    DRAFT = "DRAFT"

    def __str__(self) -> str:
        return str(self.value)
