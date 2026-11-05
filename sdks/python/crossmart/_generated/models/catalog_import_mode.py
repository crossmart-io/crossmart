from enum import StrEnum


class CatalogImportMode(StrEnum):
    CREATE = "create"
    CREATE_OR_LINK = "create_or_link"
    INVENTORY = "inventory"
    UPDATE = "update"

    def __str__(self) -> str:
        return str(self.value)
