from enum import StrEnum


class CatalogGap(StrEnum):
    BARCODE = "barcode"
    DESCRIPTION = "description"
    IMAGES = "images"
    OUT_OF_STOCK = "out_of_stock"
    SKU = "sku"

    def __str__(self) -> str:
        return str(self.value)
