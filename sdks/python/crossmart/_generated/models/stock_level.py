from enum import StrEnum


class StockLevel(StrEnum):
    IN_STOCK = "in_stock"
    LOW_STOCK = "low_stock"
    OUT_OF_STOCK = "out_of_stock"
    UNTRACKED = "untracked"

    def __str__(self) -> str:
        return str(self.value)
