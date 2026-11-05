from enum import StrEnum


class CatalogImportFormat(StrEnum):
    INVENTORY_CSV = "inventory_csv"
    SHOPIFY_API = "shopify_api"
    SHOPIFY_CSV = "shopify_csv"

    def __str__(self) -> str:
        return str(self.value)
